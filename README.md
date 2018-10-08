# PzotIDE

A Theia Application with PZot Language Server extension.

## Requirements
Node.JS, >= 8.9.1, < 9.0.0 (suggested 8.11.3 LTS)
Lerna  
Typescript
Yarn 

## Build Instructions

Build the language server
```
  cd xtext-pzot-language-server &&
  ./gradlew shadowJar &&
  cd .. 
```

Install dependencies (we use Yarn and Lerna to manage the packages)
```
  yarn
```

## Run Electron App
```
  cd electron-app &&
  yarn start  &&
  cd ..
```

## Run Web App
```
  cd browser-app &&
  yarn start  &&
  cd ..
```
