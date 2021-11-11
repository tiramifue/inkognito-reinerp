@echo off
set /p msg="Enter commit message: "
git add .
git pull origin master
git commit -m "%msg%"
git push origin master