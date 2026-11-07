Add-Type -AssemblyName System.Drawing

function New-FarmIcon([string]$Path, [int]$Size) {
    $bitmap = New-Object System.Drawing.Bitmap $Size, $Size
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#c8de75'))
    $scale = $Size / 180.0
    $dark = [System.Drawing.ColorTranslator]::FromHtml('#173e2c')
    $cream = [System.Drawing.ColorTranslator]::FromHtml('#fffdf3')
    $orange = [System.Drawing.ColorTranslator]::FromHtml('#ef8d3b')
    $pen = New-Object System.Drawing.Pen $dark, ([Math]::Max(1.5, 7 * $scale))
    $pen.StartCap = $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $graphics.FillEllipse((New-Object System.Drawing.SolidBrush $cream), 19*$scale, 19*$scale, 142*$scale, 142*$scale)
    $graphics.DrawEllipse($pen, 19*$scale, 19*$scale, 142*$scale, 142*$scale)
    $stem = New-Object System.Drawing.Pen $dark, ([Math]::Max(1.5, 8 * $scale))
    $stem.StartCap = $stem.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $graphics.DrawLine($stem, 91*$scale, 127*$scale, 91*$scale, 67*$scale)
    $leafBrush = New-Object System.Drawing.SolidBrush $dark
    $left = [System.Drawing.PointF[]]@(
        (New-Object System.Drawing.PointF (88*$scale),(92*$scale)),
        (New-Object System.Drawing.PointF (40*$scale),(45*$scale)),
        (New-Object System.Drawing.PointF (43*$scale),(101*$scale))
    )
    $right = [System.Drawing.PointF[]]@(
        (New-Object System.Drawing.PointF (94*$scale),(89*$scale)),
        (New-Object System.Drawing.PointF (139*$scale),(48*$scale)),
        (New-Object System.Drawing.PointF (139*$scale),(103*$scale))
    )
    $graphics.FillClosedCurve($leafBrush, $left)
    $graphics.FillClosedCurve($leafBrush, $right)
    $graphics.FillEllipse((New-Object System.Drawing.SolidBrush $orange), 82*$scale, 119*$scale, 18*$scale, 18*$scale)
    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $pen.Dispose(); $stem.Dispose(); $leafBrush.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}

New-FarmIcon (Join-Path $PSScriptRoot 'apple-touch-icon.png') 180
New-FarmIcon (Join-Path $PSScriptRoot 'favicon-32.png') 32
Copy-Item (Join-Path $PSScriptRoot 'apple-touch-icon.png') (Join-Path $PSScriptRoot 'submission\apple-touch-icon.png') -Force
Copy-Item (Join-Path $PSScriptRoot 'favicon-32.png') (Join-Path $PSScriptRoot 'submission\favicon-32.png') -Force

$source = [System.Drawing.Image]::FromFile((Join-Path $PSScriptRoot 'submission\desktop.png'))
$cover = New-Object System.Drawing.Bitmap 1200, 630
$graphics = [System.Drawing.Graphics]::FromImage($cover)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$graphics.DrawImage($source, (New-Object System.Drawing.Rectangle 0,0,1200,630), 0,36,1920,1008, [System.Drawing.GraphicsUnit]::Pixel)
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
$parameters = New-Object System.Drawing.Imaging.EncoderParameters 1
$parameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]72)
$cover.Save((Join-Path $PSScriptRoot 'submission\cover.jpg'), $codec, $parameters)
$parameters.Dispose(); $graphics.Dispose(); $cover.Dispose(); $source.Dispose()
