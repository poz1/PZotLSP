# Theia & PZot

A Theia Application with PZot Language Server extension.

Node.JS, >= 8.9.1, < 9.0.0

## Build and Run

Build the language server
```
  cd xtext-pzot-language-server &&
  ./gradlew shadowJar &&
  cd ..
```

Build and start Theia
```
  yarn install && 
  yarn rebuild:electron &&
  cd pzot-electron &&
  yarn start
```
