#!/usr/bin/env pwsh

# Script para iniciar el servidor de desarrollo de Punta Cana Academy
Write-Host "Iniciando servidor de desarrollo..." -ForegroundColor Green

# Cambiar al directorio del proyecto
Set-Location "C:\Users\User\OneDrive\Desktop\punta-cana-academy\punta-cana-academy"

# Verificar que estamos en el directorio correcto
Write-Host "Directorio actual: $(Get-Location)" -ForegroundColor Yellow
Write-Host "Archivo package.json existe: $(Test-Path 'package.json')" -ForegroundColor Yellow

# Limpiar la cache de Next.js si existe
if (Test-Path ".next") {
    Write-Host "Limpiando cache de Next.js..." -ForegroundColor Blue
    Remove-Item -Path ".next" -Recurse -Force
}

# Iniciar el servidor
Write-Host "Ejecutando npm run dev..." -ForegroundColor Green
& npm run dev