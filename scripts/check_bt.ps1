[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]

function Await($WinRtTask, $ResultType) {
    try {
        $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
        $netTask = $asTask.Invoke($null, @($WinRtTask))
        $netTask.Wait(3000)
        return $netTask.Result
    } catch {
        return $null
    }
}

$result = [ordered]@{
    hasBluetoothService = $false
    hasAdapter = $false
    adapterName = "Bluetooth Adapter"
    radioState = "Unknown"
    isLowEnergySupported = $false
    isPeripheralRoleSupported = $false
    isAdvertisementOffloadSupported = $false
    canBroadcastBle = $false
    isCompatible = $false
}

# 1. Dịch vụ bthserv
$svc = Get-Service -Name "bthserv" -ErrorAction SilentlyContinue
if ($null -ne $svc -and $svc.Status -eq "Running") {
    $result.hasBluetoothService = $true
}

# 2. Adapter & Radio
try {
    [Windows.Devices.Bluetooth.BluetoothAdapter, Windows.Devices.Bluetooth, ContentType = WindowsRuntime] | Out-Null
    $adapterOp = [Windows.Devices.Bluetooth.BluetoothAdapter]::GetDefaultAsync()
    $adapter = Await $adapterOp ([Windows.Devices.Bluetooth.BluetoothAdapter])

    if ($null -ne $adapter) {
        $result.hasAdapter = $true
        $result.isLowEnergySupported = [bool]$adapter.IsLowEnergySupported
        $result.isPeripheralRoleSupported = [bool]$adapter.IsPeripheralRoleSupported
        $result.isAdvertisementOffloadSupported = [bool]$adapter.IsAdvertisementOffloadSupported

        $pnp = Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.FriendlyName -like "*Adapter*" -or $_.FriendlyName -like "*Realtek*" -or $_.FriendlyName -like "*Intel*" } | Select-Object -First 1
        if ($null -ne $pnp) {
            $result.adapterName = $pnp.FriendlyName
        }

        try {
            $radioOp = $adapter.GetRadioAsync()
            $radio = Await $radioOp ([Windows.Devices.Radios.Radio])
            if ($null -ne $radio) {
                $result.radioState = $radio.State.ToString()
            }
        } catch {}

        if ($result.radioState -eq "Unknown" -or [string]::IsNullOrEmpty($result.radioState)) {
            $pnpDev = Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.FriendlyName -eq $result.adapterName } | Select-Object -First 1
            if ($null -ne $pnpDev -and $pnpDev.Status -eq "OK") {
                $result.radioState = "On"
            }
        }

        # 3. Test phát sóng thực tế HID (0x1812)
        $advAborted = $false
        try {
            [Windows.Devices.Bluetooth.GenericAttributeProfile.GattServiceProvider, Windows.Devices.Bluetooth, ContentType = WindowsRuntime] | Out-Null
            $hidUuid = [System.Guid]::Parse("00001812-0000-1000-8000-00805f9b34fb")
            $spRes = Await ([Windows.Devices.Bluetooth.GenericAttributeProfile.GattServiceProvider]::CreateAsync($hidUuid)) ([Windows.Devices.Bluetooth.GenericAttributeProfile.GattServiceProviderResult])
            if ($null -ne $spRes.ServiceProvider) {
                $testSp = $spRes.ServiceProvider
                $testParams = New-Object Windows.Devices.Bluetooth.GenericAttributeProfile.GattServiceProviderAdvertisingParameters
                $testParams.IsConnectable = $true
                $testParams.IsDiscoverable = $true
                $testSp.StartAdvertising($testParams)
                Start-Sleep -Milliseconds 500
                if ($testSp.AdvertisementStatus -eq "Aborted") {
                    $advAborted = $true
                }
                $testSp.StopAdvertising()
            } else {
                $advAborted = $true
            }
        } catch {
            $advAborted = $true
        }

        if (-not $advAborted) {
            $result.canBroadcastBle = $true
        }
    }
} catch {}

if ($result.hasBluetoothService -and $result.hasAdapter -and $result.radioState -eq "On" -and $result.isLowEnergySupported -and $result.isPeripheralRoleSupported -and $result.canBroadcastBle) {
    $result.isCompatible = $true
} else {
    $result.isCompatible = $false
}

$result | ConvertTo-Json -Depth 4 -Compress
