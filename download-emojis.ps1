# Налаштування шляхів
$baseUrl = "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/svg/emoji_u"
$targetDirColor = "static/emojis/color"
$targetDirMono = "static/emojis/mono"

# Створення папок, якщо їх немає
if (!(Test-Path -Path $targetDirColor)) { New-Item -ItemType Directory -Force -Path $targetDirColor | Out-Null }
if (!(Test-Path -Path $targetDirMono)) { New-Item -ItemType Directory -Force -Path $targetDirMono | Out-Null }

# Словник: "Назва_в_коді" = "Unicode_код_Google" (або ISO для прапорів)
$emojis = @{
    "globe_showing_europe_africa" = "1f30d";
    "hatching_chick"              = "1f423";
    "brain"                       = "1f9e0";
    "fire"                        = "1f525";
    "stopwatch"                   = "23f1";
    "busts_in_silhouette"         = "1f465";
    "robot"                       = "1f916";
    "bust_in_silhouette"          = "1f464";
    "sun"                         = "2600";
    "crescent_moon"               = "1f319";
    "memo"                        = "1f4dd";
    "trophy"                      = "1f3c6";
    "gear"                        = "2699";
    "keyboard"                    = "2328";
    "coin"                        = "1fa99";
    "speech_balloon"              = "1f4ac";
    "light_bulb"                  = "1f4a1";
    "bug"                         = "1f41b";
    "thought_balloon"             = "1f4ad";
    "spiral_shell"                = "1f41a";
    "1st_place_medal"             = "1f947";
    "2nd_place_medal"             = "1f948";
    "3rd_place_medal"             = "1f949";
    "check_mark_button"           = "2705";
    "cross_mark"                  = "274c";
    "pencil"                      = "270f";
    "game_die"                    = "1f3b2";
    "plus"                        = "2795";
    "locked"                      = "1f512";
    "crown"                       = "1f451";
    "house"                       = "1f3e0";
    "broom"                       = "1f9f9";
    "handshake"                   = "1f91d";
}

# Спеціальна обробка прапорів (вони лежать в іншому місці і мають ISO імена)
$flags = @{
    "flag_ukraine"        = "UA";
    "flag_united_kingdom" = "GB";
    "flag_turkey"         = "TR";
    "flag_netherlands"    = "NL";
}

Write-Host "🚀 Починаємо завантаження емодзі..." -ForegroundColor Cyan

$flagBaseUrl = "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/third_party/region-flags/svg/"

# Об'єднуємо списки для циклу
$allAssets = @{}
foreach ($k in $emojis.Keys) { $allAssets[$k] = @{ code = $emojis[$k]; isFlag = $false } }
foreach ($k in $flags.Keys) { $allAssets[$k] = @{ code = $flags[$k]; isFlag = $true } }

foreach ($name in $allAssets.Keys) {
    $asset = $allAssets[$name]
    $code = $asset.code
    
    if ($asset.isFlag) {
        $url = "$flagBaseUrl$code.svg"
    }
    else {
        $url = "$baseUrl$code.svg"
    }
    
    $outputFile = "$targetDirColor/$name.svg"
    $monoFile = "$targetDirMono/$name.svg"

    Write-Host "Завантаження: $name ($code)..." -NoNewline

    try {
        # Завантаження файлу
        Invoke-WebRequest -Uri $url -OutFile $outputFile -ErrorAction Stop
        
        # Копіювання в папку mono
        Copy-Item -Path $outputFile -Destination $monoFile -Force

        Write-Host " OK" -ForegroundColor Green
    }
    catch {
        Write-Host " ПОМИЛКА" -ForegroundColor Red
        Write-Host "  Не вдалося завантажити $url" -ForegroundColor DarkGray
    }
}

Write-Host "`n✅ Завантаження завершено!" -ForegroundColor Cyan