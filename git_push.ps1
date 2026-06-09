$log = "C:\Users\Cheffo\Documents\Claude\Projects\Pagina web gym\oscar-galvan-gym-web\git_log.txt"
$project = "C:\Users\Cheffo\Documents\Claude\Projects\Pagina web gym\oscar-galvan-gym-web"

"=== GIT PUSH LOG $(Get-Date) ===" | Out-File $log

Set-Location $project

# Configurar git
git config --global user.email "ceferinoyanezz@gmail.com" 2>&1 | Out-File $log -Append
git config --global user.name "CheffoIT" 2>&1 | Out-File $log -Append

# Remover .git si existe
if (Test-Path ".git") {
    "Removiendo .git anterior..." | Out-File $log -Append
    Remove-Item -Recurse -Force ".git"
}

"Inicializando git..." | Out-File $log -Append
git init 2>&1 | Out-File $log -Append

git config core.symlinks false 2>&1 | Out-File $log -Append

"Agregando remote..." | Out-File $log -Append
git remote add origin https://github.com/CheffoIT/oscar-galvan-gym-web.git 2>&1 | Out-File $log -Append

"Agregando archivos..." | Out-File $log -Append
git add . 2>&1 | Out-File $log -Append

"Haciendo commit..." | Out-File $log -Append
git commit -m "Initial commit: Plataforma web gimnasio Oscar Galvan - React + Supabase" 2>&1 | Out-File $log -Append

"Cambiando a main..." | Out-File $log -Append
git branch -M main 2>&1 | Out-File $log -Append

"Haciendo push..." | Out-File $log -Append
git push -u origin main 2>&1 | Out-File $log -Append

"=== FIN ===" | Out-File $log -Append
Get-Content $log
