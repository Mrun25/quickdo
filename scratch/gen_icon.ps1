Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap 256, 256
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
$g.Clear([System.Drawing.Color]::Navy)
$font = New-Object System.Drawing.Font "Segoe UI Emoji", 100
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

# Measure string to center it
$str = "✨"
$size = $g.MeasureString($str, $font)
$x = (256 - $size.Width) / 2
$y = (256 - $size.Height) / 2

$g.DrawString($str, $font, $brush, $x, $y)
$path = "d:\Antigravity\quickDo\assets\icon.png"
if (!(Test-Path -Path "d:\Antigravity\quickDo\assets")) {
    New-Item -ItemType Directory -Path "d:\Antigravity\quickDo\assets"
}
$bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
