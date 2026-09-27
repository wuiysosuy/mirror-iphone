using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Windows.Devices.Bluetooth;
using Windows.Devices.Bluetooth.GenericAttributeProfile;
using Windows.Storage.Streams;

namespace AirCast.Native {
    class Program {
        private static GattServiceProvider? hidServiceProvider;
        private static GattServiceProvider? devInfoServiceProvider;
        private static GattServiceProvider? batteryServiceProvider;
        private static GattLocalCharacteristic? mouseReportChar;
        private static GattLocalCharacteristic? bootMouseReportChar;
        private static byte currentButtons = 0; // bit 0: Left, bit 1: Right, bit 2: Middle
        private static bool isAdvertising = false;
        private static int connectedClients = 0;
        private static bool airplayHookActive = true;
        private static float mouseSensitivity = 1.25f;

        // Standard USB/BLE HID Mouse Report Descriptor (Without ambiguous Report ID)
        // 4 bytes input report: [Buttons, X, Y, Wheel]
        private static readonly byte[] ReportMap = new byte[] {
            0x05, 0x01,                    // USAGE_PAGE (Generic Desktop)
            0x09, 0x02,                    // USAGE (Mouse)
            0xA1, 0x01,                    // COLLECTION (Application)
            0x09, 0x01,                    //   USAGE (Pointer)
            0xA1, 0x00,                    //   COLLECTION (Physical)
            // 3 Buttons
            0x05, 0x09,                    //     USAGE_PAGE (Button)
            0x19, 0x01,                    //     USAGE_MINIMUM (Button 1)
            0x29, 0x03,                    //     USAGE_MAXIMUM (Button 3)
            0x15, 0x00,                    //     LOGICAL_MINIMUM (0)
            0x25, 0x01,                    //     LOGICAL_MAXIMUM (1)
            0x95, 0x03,                    //     REPORT_COUNT (3)
            0x75, 0x01,                    //     REPORT_SIZE (1)
            0x81, 0x02,                    //     INPUT (Data,Var,Abs)
            // Padding (5 bits)
            0x95, 0x01,                    //     REPORT_COUNT (1)
            0x75, 0x05,                    //     REPORT_SIZE (5)
            0x81, 0x03,                    //     INPUT (Cnst,Var,Abs)
            // X, Y (Relative -127 to 127)
            0x05, 0x01,                    //     USAGE_PAGE (Generic Desktop)
            0x09, 0x30,                    //     USAGE (X)
            0x09, 0x31,                    //     USAGE (Y)
            0x15, 0x81,                    //     LOGICAL_MINIMUM (-127)
            0x25, 0x7F,                    //     LOGICAL_MAXIMUM (127)
            0x75, 0x08,                    //     REPORT_SIZE (8)
            0x95, 0x02,                    //     REPORT_COUNT (2)
            0x81, 0x06,                    //     INPUT (Data,Var,Rel)
            // Wheel (-127 to 127)
            0x09, 0x38,                    //     USAGE (Wheel)
            0x15, 0x81,                    //     LOGICAL_MINIMUM (-127)
            0x25, 0x7F,                    //     LOGICAL_MAXIMUM (127)
            0x75, 0x08,                    //     REPORT_SIZE (8)
            0x95, 0x01,                    //     REPORT_COUNT (1)
            0x81, 0x06,                    //     INPUT (Data,Var,Rel)
            0xC0,                          //   END_COLLECTION
            0xC0                           // END_COLLECTION
        };

        private static IBuffer ToBuffer(byte[] data) {
            var writer = new DataWriter();
            writer.WriteBytes(data);
            return writer.DetachBuffer();
        }

        private static void SendJson(object obj) {
            try {
                Console.WriteLine(JsonSerializer.Serialize(obj));
            } catch { }
        }

        #region Win32 Interop for AirPlay Window Hover Detection
        [StructLayout(LayoutKind.Sequential)]
        private struct RECT {
            public int Left;
            public int Top;
            public int Right;
            public int Bottom;
        }

        [DllImport("user32.dll")]
        private static extern bool GetClientRect(IntPtr hWnd, out RECT lpRect);

        [DllImport("user32.dll")]
        private static extern bool ClientToScreen(IntPtr hWnd, ref POINT lpPoint);

        private struct POINT {
            public int X;
            public int Y;
        }

        [DllImport("user32.dll")]
        private static extern bool GetCursorPos(out POINT lpPoint);

        [DllImport("user32.dll")]
        private static extern IntPtr WindowFromPoint(POINT Point);

        [DllImport("user32.dll", ExactSpelling = true)]
        private static extern IntPtr GetAncestor(IntPtr hwnd, uint gaFlags);
        private const uint GA_ROOT = 2;

        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        private static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount);

        [DllImport("user32.dll")]
        private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

        [DllImport("user32.dll")]
        private static extern short GetAsyncKeyState(int vKey);

        private const int VK_LBUTTON = 0x01;
        private const int VK_RBUTTON = 0x02;

        private static bool IsAirPlayWindow(IntPtr hWnd) {
            if (hWnd == IntPtr.Zero) return false;
            IntPtr root = GetAncestor(hWnd, GA_ROOT);
            if (root == IntPtr.Zero) root = hWnd;

            var sb = new System.Text.StringBuilder(256);
            GetWindowText(root, sb, 256);
            string title = sb.ToString();

            // Exclude our main dashboard window
            if (!string.IsNullOrEmpty(title) && title.IndexOf("AirCast", StringComparison.OrdinalIgnoreCase) >= 0) {
                return false;
            }

            GetWindowThreadProcessId(root, out uint pid);
            if (pid != 0) {
                try {
                    var p = Process.GetProcessById((int)pid);
                    string procName = p.ProcessName;
                    if (procName.IndexOf("electron", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        procName.IndexOf("AirCast", StringComparison.OrdinalIgnoreCase) >= 0) {
                        return false;
                    }
                    if (procName.IndexOf("AirPlay", StringComparison.OrdinalIgnoreCase) >= 0) {
                        return true;
                    }
                } catch { }
            }

            if (!string.IsNullOrEmpty(title)) {
                if (title.IndexOf("AirPlay Receiver", StringComparison.OrdinalIgnoreCase) >= 0 ||
                    (title.IndexOf("AirPlay", StringComparison.OrdinalIgnoreCase) >= 0 && title.IndexOf("Receiver", StringComparison.OrdinalIgnoreCase) >= 0)) {
                    return true;
                }
            }

            return false;
        }

        #endregion

        private static void StartAirPlayWindowMonitor() {
            Task.Run(async () => {
                POINT lastPt = new POINT();
                bool lastLDown = false;
                bool lastRDown = false;
                bool wasInside = false;

                while (true) {
                    try {
                        await Task.Delay(14); // ~70 Hz poll rate for silky smooth tracking

                        if (!airplayHookActive) continue;

                        if (GetCursorPos(out POINT curPt)) {
                            IntPtr hWnd = WindowFromPoint(curPt);
                            bool inside = IsAirPlayWindow(hWnd);

                            if (inside) {
                                bool isLDown = (GetAsyncKeyState(VK_LBUTTON) & 0x8000) != 0;
                                bool isRDown = (GetAsyncKeyState(VK_RBUTTON) & 0x8000) != 0;

                                if (!wasInside) {
                                    wasInside = true;
                                    lastPt = curPt;
                                    lastLDown = isLDown;
                                    lastRDown = isRDown;
                                    SendJson(new { @event = "airplay_window_entered", message = "Con trỏ đã vào cửa sổ AirPlay Receiver -> Kích hoạt điều khiển iPhone!" });
                                    continue;
                                }

                                int rawDx = curPt.X - lastPt.X;
                                int rawDy = curPt.Y - lastPt.Y;
                                lastPt = curPt;

                                int dx = (int)(rawDx * mouseSensitivity);
                                int dy = (int)(rawDy * mouseSensitivity);

                                byte btn = 0;
                                if (isLDown) btn |= 0x01;
                                if (isRDown) btn |= 0x02;

                                if (dx != 0 || dy != 0 || isLDown != lastLDown || isRDown != lastRDown) {
                                    sbyte stepX = (sbyte)Math.Clamp(dx, -127, 127);
                                    sbyte stepY = (sbyte)Math.Clamp(dy, -127, 127);
                                    await SendMouseReport(btn, stepX, stepY, 0);
                                }

                                lastLDown = isLDown;
                                lastRDown = isRDown;
                            } else {
                                if (wasInside) {
                                    wasInside = false;
                                    if (lastLDown || lastRDown) {
                                        await SendMouseReport(0, 0, 0, 0);
                                        lastLDown = false;
                                        lastRDown = false;
                                    }
                                }
                            }
                        }
                    } catch { }
                }
            });
        }

        static async Task Main(string[] args) {
            Console.OutputEncoding = System.Text.Encoding.UTF8;
            SendJson(new { @event = "ready", message = "AirCast Bluetooth HID Service Ready" });

            // Check adapter capability
            try {
                var adapter = await BluetoothAdapter.GetDefaultAsync();
                if (adapter == null) {
                    SendJson(new { @event = "error", error = "Không tìm thấy bộ điều hợp Bluetooth trên máy tính." });
                } else if (!adapter.IsPeripheralRoleSupported) {
                    SendJson(new { @event = "error", error = "Card Bluetooth máy tính không hỗ trợ Peripheral Role." });
                } else {
                    SendJson(new { 
                        @event = "adapter_ready", 
                        deviceId = adapter.DeviceId, 
                        isPeripheral = adapter.IsPeripheralRoleSupported 
                    });
                }
            } catch (Exception ex) {
                SendJson(new { @event = "error", error = $"Kiểm tra Bluetooth thất bại: {ex.Message}" });
            }

            // Start background AirPlay window hover tracking
            StartAirPlayWindowMonitor();

            // Command loop
            var commandTask = Task.Run(async () => {
                string? line;
                while ((line = Console.ReadLine()) != null) {
                    if (string.IsNullOrWhiteSpace(line)) continue;
                    try {
                        using var doc = JsonDocument.Parse(line);
                        var root = doc.RootElement;
                        var cmd = root.GetProperty("cmd").GetString();

                        switch (cmd) {
                            case "start":
                                string name = root.TryGetProperty("name", out var n) ? n.GetString() ?? "AirCast Mouse" : "AirCast Mouse";
                                await StartHidServer(name);
                                break;

                            case "stop":
                                StopHidServer();
                                break;

                            case "status":
                                SendJson(new { 
                                    @event = "status_report", 
                                    isAdvertising = isAdvertising, 
                                    connectedClients = connectedClients 
                                });
                                break;

                            case "mouse_move":
                                int dx = root.GetProperty("dx").GetInt32();
                                int dy = root.GetProperty("dy").GetInt32();
                                await SendMouseReport(currentButtons, (sbyte)Math.Clamp(dx, -127, 127), (sbyte)Math.Clamp(dy, -127, 127), 0);
                                break;

                            case "mouse_down":
                                string btnDown = root.GetProperty("button").GetString() ?? "left";
                                if (btnDown == "left") currentButtons |= 0x01;
                                else if (btnDown == "right") currentButtons |= 0x02;
                                else if (btnDown == "middle") currentButtons |= 0x04;
                                await SendMouseReport(currentButtons, 0, 0, 0);
                                break;

                            case "mouse_up":
                                string btnUp = root.GetProperty("button").GetString() ?? "left";
                                if (btnUp == "left") currentButtons = (byte)(currentButtons & ~0x01);
                                else if (btnUp == "right") currentButtons = (byte)(currentButtons & ~0x02);
                                else if (btnUp == "middle") currentButtons = (byte)(currentButtons & ~0x04);
                                await SendMouseReport(currentButtons, 0, 0, 0);
                                break;

                            case "mouse_wheel":
                                int delta = root.GetProperty("delta").GetInt32();
                                await SendMouseReport(currentButtons, 0, 0, (sbyte)Math.Clamp(delta, -127, 127));
                                break;

                            case "tap":
                                await SendMouseReport(0x01, 0, 0, 0);
                                await Task.Delay(50);
                                await SendMouseReport(0x00, 0, 0, 0);
                                break;

                            case "home":
                                await SendMouseReport(0x02, 0, 0, 0);
                                await Task.Delay(60);
                                await SendMouseReport(0x00, 0, 0, 0);
                                break;

                            case "swipe_up":
                                await PerformSwipe(0, -25, 8);
                                break;

                            case "swipe_down":
                                await PerformSwipe(0, 25, 8);
                                break;

                            case "swipe_left":
                                await PerformSwipe(-25, 0, 8);
                                break;

                            case "swipe_right":
                                await PerformSwipe(25, 0, 8);
                                break;

                            case "set_sensitivity":
                                if (root.TryGetProperty("val", out var sensVal)) {
                                    mouseSensitivity = (float)sensVal.GetDouble();
                                }
                                break;

                            case "exit":
                                StopHidServer();
                                Environment.Exit(0);
                                break;
                        }
                    } catch (Exception ex) {
                        SendJson(new { @event = "error", error = ex.Message });
                    }
                }

                StopHidServer();
                Environment.Exit(0);
            });

            if (args.Length > 0 && args[0] == "--autostart") {
                await StartHidServer("AirCast Mouse");
            }

            await commandTask;
        }

        private static async Task PerformSwipe(int stepX, int stepY, int steps) {
            await SendMouseReport(0x01, 0, 0, 0);
            await Task.Delay(30);

            for (int i = 0; i < steps; i++) {
                await SendMouseReport(0x01, (sbyte)Math.Clamp(stepX, -127, 127), (sbyte)Math.Clamp(stepY, -127, 127), 0);
                await Task.Delay(20);
            }

            await SendMouseReport(0x00, 0, 0, 0);
        }

        private static async Task StartHidServer(string deviceName) {
            if (isAdvertising) {
                SendJson(new { @event = "info", message = "Bluetooth Mouse đang phát sóng rồi." });
                return;
            }

            try {
                SendJson(new { @event = "status", status = "starting", message = "Đang khởi tạo các dịch vụ GATT Bluetooth..." });

                // 1. Device Information Service (0x180A)
                var devInfoUuid = new Guid("0000180A-0000-1000-8000-00805F9B34FB");
                var devInfoRes = await GattServiceProvider.CreateAsync(devInfoUuid);
                if (devInfoRes.Error == BluetoothError.Success && devInfoRes.ServiceProvider != null) {
                    devInfoServiceProvider = devInfoRes.ServiceProvider;
                    
                    // Manufacturer (0x2A29)
                    var mfgCharUuid = new Guid("00002A29-0000-1000-8000-00805F9B34FB");
                    var mfgParams = new GattLocalCharacteristicParameters {
                        CharacteristicProperties = GattCharacteristicProperties.Read,
                        StaticValue = ToBuffer(System.Text.Encoding.UTF8.GetBytes("Apple Inc.")),
                        ReadProtectionLevel = GattProtectionLevel.Plain
                    };
                    await devInfoServiceProvider.Service.CreateCharacteristicAsync(mfgCharUuid, mfgParams);

                    // PnP ID (0x2A50) - mandatory for Apple HOGP
                    var pnpCharUuid = new Guid("00002A50-0000-1000-8000-00805F9B34FB");
                    // Vendor ID Source: 1 (Bluetooth SIG), Vendor ID: 0x004C (Apple Inc), Product ID: 0x0269 (Magic Mouse), Version: 0x0100
                    byte[] pnpData = new byte[] { 0x01, 0x4C, 0x00, 0x69, 0x02, 0x00, 0x01 };
                    var pnpParams = new GattLocalCharacteristicParameters {
                        CharacteristicProperties = GattCharacteristicProperties.Read,
                        StaticValue = ToBuffer(pnpData),
                        ReadProtectionLevel = GattProtectionLevel.Plain
                    };
                    await devInfoServiceProvider.Service.CreateCharacteristicAsync(pnpCharUuid, pnpParams);
                }

                // 2. Battery Service (0x180F)
                var batUuid = new Guid("0000180F-0000-1000-8000-00805F9B34FB");
                var batRes = await GattServiceProvider.CreateAsync(batUuid);
                if (batRes.Error == BluetoothError.Success && batRes.ServiceProvider != null) {
                    batteryServiceProvider = batRes.ServiceProvider;
                    var batLevelUuid = new Guid("00002A19-0000-1000-8000-00805F9B34FB");
                    var batParams = new GattLocalCharacteristicParameters {
                        CharacteristicProperties = GattCharacteristicProperties.Read | GattCharacteristicProperties.Notify,
                        StaticValue = ToBuffer(new byte[] { 95 }), // 95%
                        ReadProtectionLevel = GattProtectionLevel.Plain
                    };
                    await batteryServiceProvider.Service.CreateCharacteristicAsync(batLevelUuid, batParams);
                }

                // 3. Human Interface Device (0x1812)
                var hidUuid = new Guid("00001812-0000-1000-8000-00805F9B34FB");
                var hidRes = await GattServiceProvider.CreateAsync(hidUuid);
                if (hidRes.Error != BluetoothError.Success || hidRes.ServiceProvider == null) {
                    SendJson(new { @event = "error", error = $"Không thể tạo HID Service: {hidRes.Error}" });
                    return;
                }
                hidServiceProvider = hidRes.ServiceProvider;

                // HID Information (0x2A4A)
                var hidInfoUuid = new Guid("00002A4A-0000-1000-8000-00805F9B34FB");
                var hidInfoParams = new GattLocalCharacteristicParameters {
                    CharacteristicProperties = GattCharacteristicProperties.Read,
                    // bcdHID: 0x0111 (v1.11), bCountryCode: 0, Flags: 0x02 (NormallyConnectable)
                    StaticValue = ToBuffer(new byte[] { 0x11, 0x01, 0x00, 0x02 }),
                    ReadProtectionLevel = GattProtectionLevel.Plain
                };
                await hidServiceProvider.Service.CreateCharacteristicAsync(hidInfoUuid, hidInfoParams);

                // Report Map (0x2A4B)
                var reportMapUuid = new Guid("00002A4B-0000-1000-8000-00805F9B34FB");
                var reportMapParams = new GattLocalCharacteristicParameters {
                    CharacteristicProperties = GattCharacteristicProperties.Read,
                    StaticValue = ToBuffer(ReportMap),
                    ReadProtectionLevel = GattProtectionLevel.EncryptionRequired
                };
                await hidServiceProvider.Service.CreateCharacteristicAsync(reportMapUuid, reportMapParams);

                // Protocol Mode (0x2A4E)
                var protoUuid = new Guid("00002A4E-0000-1000-8000-00805F9B34FB");
                var protoParams = new GattLocalCharacteristicParameters {
                    CharacteristicProperties = GattCharacteristicProperties.Read | GattCharacteristicProperties.WriteWithoutResponse,
                    StaticValue = ToBuffer(new byte[] { 0x01 }), // 1 = Report Protocol
                    ReadProtectionLevel = GattProtectionLevel.EncryptionRequired,
                    WriteProtectionLevel = GattProtectionLevel.EncryptionRequired
                };
                var protoCharRes = await hidServiceProvider.Service.CreateCharacteristicAsync(protoUuid, protoParams);
                if (protoCharRes.Error == BluetoothError.Success && protoCharRes.Characteristic != null) {
                    protoCharRes.Characteristic.WriteRequested += async (s, e) => {
                        using var deferral = e.GetDeferral();
                        var req = await e.GetRequestAsync();
                        if (req != null && req.Option == GattWriteOption.WriteWithResponse) {
                            req.Respond();
                        }
                        deferral.Complete();
                    };
                }

                // HID Control Point (0x2A4C)
                var ctrlUuid = new Guid("00002A4C-0000-1000-8000-00805F9B34FB");
                var ctrlParams = new GattLocalCharacteristicParameters {
                    CharacteristicProperties = GattCharacteristicProperties.WriteWithoutResponse,
                    WriteProtectionLevel = GattProtectionLevel.EncryptionRequired
                };
                var ctrlCharRes = await hidServiceProvider.Service.CreateCharacteristicAsync(ctrlUuid, ctrlParams);
                if (ctrlCharRes.Error == BluetoothError.Success && ctrlCharRes.Characteristic != null) {
                    ctrlCharRes.Characteristic.WriteRequested += async (s, e) => {
                        using var deferral = e.GetDeferral();
                        var req = await e.GetRequestAsync();
                        if (req != null && req.Option == GattWriteOption.WriteWithResponse) {
                            req.Respond();
                        }
                        deferral.Complete();
                    };
                }

                // Mouse Report Characteristic (0x2A4D)
                var reportUuid = new Guid("00002A4D-0000-1000-8000-00805F9B34FB");
                var reportParams = new GattLocalCharacteristicParameters {
                    CharacteristicProperties = GattCharacteristicProperties.Read | GattCharacteristicProperties.Notify,
                    ReadProtectionLevel = GattProtectionLevel.EncryptionRequired,
                    StaticValue = ToBuffer(new byte[] { 0, 0, 0, 0 })
                };
                var reportCharRes = await hidServiceProvider.Service.CreateCharacteristicAsync(reportUuid, reportParams);
                if (reportCharRes.Error == BluetoothError.Success && reportCharRes.Characteristic != null) {
                    mouseReportChar = reportCharRes.Characteristic;

                    // Report Reference Descriptor (0x2908) -> Report ID: 0, Type: 1 (Input)
                    var repRefUuid = new Guid("00002908-0000-1000-8000-00805F9B34FB");
                    var repRefParams = new GattLocalDescriptorParameters {
                        StaticValue = ToBuffer(new byte[] { 0x00, 0x01 }),
                        ReadProtectionLevel = GattProtectionLevel.EncryptionRequired
                    };
                    await mouseReportChar.CreateDescriptorAsync(repRefUuid, repRefParams);

                    mouseReportChar.SubscribedClientsChanged += (s, e) => {
                        UpdateConnectedClients();
                    };
                }

                // Boot Mouse Input Report (0x2A33)
                var bootMouseUuid = new Guid("00002A33-0000-1000-8000-00805F9B34FB");
                var bootMouseParams = new GattLocalCharacteristicParameters {
                    CharacteristicProperties = GattCharacteristicProperties.Read | GattCharacteristicProperties.Notify,
                    ReadProtectionLevel = GattProtectionLevel.EncryptionRequired,
                    StaticValue = ToBuffer(new byte[] { 0, 0, 0 })
                };
                var bootCharRes = await hidServiceProvider.Service.CreateCharacteristicAsync(bootMouseUuid, bootMouseParams);
                if (bootCharRes.Error == BluetoothError.Success && bootCharRes.Characteristic != null) {
                    bootMouseReportChar = bootCharRes.Characteristic;
                    bootMouseReportChar.SubscribedClientsChanged += (s, e) => {
                        UpdateConnectedClients();
                    };
                }

                // Start Advertising
                var advParams = new GattServiceProviderAdvertisingParameters {
                    IsConnectable = true,
                    IsDiscoverable = true
                };

                hidServiceProvider.AdvertisementStatusChanged += (s, e) => {
                    SendJson(new { 
                        @event = "adv_status", 
                        status = e.Status.ToString(), 
                        error = e.Error.ToString() 
                    });
                };

                hidServiceProvider.StartAdvertising(advParams);
                isAdvertising = true;

                SendJson(new { 
                    @event = "started", 
                    deviceName = deviceName, 
                    message = $"Chuột Bluetooth đang phát sóng! Hãy vào Cài Đặt > Bluetooth trên iPhone để kết nối." 
                });

            } catch (Exception ex) {
                isAdvertising = false;
                SendJson(new { @event = "error", error = $"Khởi động Bluetooth HID thất bại: {ex.Message}" });
            }
        }

        private static void UpdateConnectedClients() {
            int count1 = mouseReportChar?.SubscribedClients.Count ?? 0;
            int count2 = bootMouseReportChar?.SubscribedClients.Count ?? 0;
            connectedClients = Math.Max(count1, count2);

            SendJson(new { 
                @event = "clients_changed", 
                clientCount = connectedClients,
                message = connectedClients > 0 ? "iPhone đã kết nối chuột thành công!" : "iPhone đã ngắt kết nối chuột."
            });
        }

        private static void StopHidServer() {
            if (!isAdvertising) return;
            try {
                hidServiceProvider?.StopAdvertising();
                devInfoServiceProvider?.StopAdvertising();
                batteryServiceProvider?.StopAdvertising();
                isAdvertising = false;
                connectedClients = 0;
                SendJson(new { @event = "stopped", message = "Đã dừng phát sóng chuột Bluetooth." });
            } catch (Exception ex) {
                SendJson(new { @event = "error", error = ex.Message });
            }
        }

        private static async Task SendMouseReport(byte buttons, sbyte dx, sbyte dy, sbyte wheel) {
            try {
                // Send to Report Characteristic (4 bytes: buttons, dx, dy, wheel)
                if (mouseReportChar != null) {
                    byte[] report = new byte[] { buttons, (byte)dx, (byte)dy, (byte)wheel };
                    var results = await mouseReportChar.NotifyValueAsync(ToBuffer(report));
                    
                    bool anySuccess = false;
                    foreach (var r in results) {
                        if (r.Status == GattCommunicationStatus.Success) anySuccess = true;
                    }

                    if (!anySuccess && mouseReportChar.SubscribedClients.Count > 0) {
                        // Also try with report id prefix 0x01 if client strictly expects it
                        byte[] reportWithId = new byte[] { 0x01, buttons, (byte)dx, (byte)dy, (byte)wheel };
                        await mouseReportChar.NotifyValueAsync(ToBuffer(reportWithId));
                    }
                }

                // Also send to Boot Mouse Characteristic (3 bytes: buttons, dx, dy)
                if (bootMouseReportChar != null) {
                    byte[] bootReport = new byte[] { buttons, (byte)dx, (byte)dy };
                    await bootMouseReportChar.NotifyValueAsync(ToBuffer(bootReport));
                }
            } catch (Exception ex) {
                SendJson(new { @event = "error", error = $"Lỗi gửi tín hiệu chuột: {ex.Message}" });
            }
        }
    }
}
