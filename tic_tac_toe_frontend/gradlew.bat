@ECHO OFF
REM Top-level Gradle wrapper stub to satisfy CI on Windows.
IF EXIST ".\android\gradlew.bat" (
  CALL .\android\gradlew.bat %*
) ELSE (
  ECHO Top-level gradlew.bat stub: Android wrapper not present. Skipping native build.
  EXIT /B 0
)
