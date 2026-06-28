# RestoManager Quick Start Script
# Run this script to start the application

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   RestoManager - Restaurant Management" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "  Node.js $nodeVersion ✓" -ForegroundColor Green
} else {
    Write-Host "  Node.js not found! Please install Node.js v18+" -ForegroundColor Red
    exit 1
}

# Check MongoDB
Write-Host "Checking MongoDB..." -ForegroundColor Yellow
$mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
if ($mongoService) {
    if ($mongoService.Status -eq "Running") {
        Write-Host "  MongoDB is running ✓" -ForegroundColor Green
    } else {
        Write-Host "  Starting MongoDB..." -ForegroundColor Yellow
        try {
            Start-Service -Name "MongoDB" -ErrorAction Stop
            Write-Host "  MongoDB started ✓" -ForegroundColor Green
        } catch {
            Write-Host "  Cannot start MongoDB (need admin rights)" -ForegroundColor Red
            Write-Host "  Please run as Administrator or start MongoDB manually" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "  MongoDB service not found" -ForegroundColor Yellow
}

# Check Redis
Write-Host "Checking Redis..." -ForegroundColor Yellow
$redisService = Get-Service -Name "Redis*" -ErrorAction SilentlyContinue
if ($redisService) {
    if ($redisService.Status -eq "Running") {
        Write-Host "  Redis is running ✓" -ForegroundColor Green
    } else {
        Write-Host "  Starting Redis..." -ForegroundColor Yellow
        Start-Service -Name $redisService.Name -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "  Redis service not found (optional)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Starting RestoManager..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Start the application
npm run dev
