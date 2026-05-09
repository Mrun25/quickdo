Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap 256, 256
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
$g.Clear([System.Drawing.Color]::Navy)
$font = New-Object System.Drawing.Font "Segoe UI Emoji", 100
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

$str = "✨"
$size = $g.MeasureString($str, $font)
$x = (256 - $size.Width) / 2
$y = (256 - $size.Height) / 2

$g.DrawString($str, $font, $brush, $x, $y)

if (!(Test-Path -Path "d:\Antigravity\quickDo\build")) {
    New-Item -ItemType Directory -Path "d:\Antigravity\quickDo\build"
}

$iconPath = "d:\Antigravity\quickDo\build\icon.ico"

# Get HIcon
$hicon = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hicon)

$stream = New-Object System.IO.FileStream($iconPath, [System.IO.FileMode]::Create)
$icon.Save($stream)
$stream.Close()
$icon.Dispose()

# Native method memory leak prevention
[System.Runtime.InteropServices.Marshal]::DestroyIcon($hicon)

$bmp.Dispose()
$g.Dispose()
