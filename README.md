# Condiments CLI

A small cli tools (based on nodejs environment)

version: 1.0.0

## Installation

```bash
npm install -g condiments-cli
# or
yarn add -g condiments-cli
```

After package installed, initialized it:

```bash
cond init
```

## Usage for Files

### Save Files

Save your file or folder to condiments library:

```bash
cond save path/your.file -a alias_name
cond save path/folder
```

Without option `-a (--alias)`, your will be ask to specify one after you run it.

### Load Files

After you saved your files. You can load them by alias anytime.

```bash
cond load alias_name -d ./
cond load myFolder
```

Without option `-d (--dist)`, files will be load to current directory.

You can use `-b (--bare)` to load folder files in flat way:

```bash
# fe-component folder: component.html, component.js, component.css

cond load fe-component -d ./my-component
# result: ./my-component/fe-component/...html, ...js, ...css

cond load fe-component -d ./my-component
# result: ./my-component/...html, ...js, ...css
```

### List Files

After files saved, you can list them to the terminal:

```bash
cond files ls
```

### Remove and Clean Files

Remove file or folder by its alias:

```bash
cond files rm alias_name
```

Remove all by use clean command:

```bash
cond files clean
```

## Usage for Scripts

For running script, only Linux / Unix shell and Powershell are supported now.

### Save Scripts

Save script code snippet:

```bash
# { } is only supported by Powershell.
cond script { ls -la } -a alias_name1
cond script "ping baidu.com" -a alias_name2
```

Save script file:

```bash
cond script script_a.ps1 -a script_a
cond script script_b.sh -a script_b
```

### Run Saved Scripts

```bash
cond run alias_name
```

### List Scripts

```bash
cond scripts ls
```

### Remove and Clean Scripts

Remove script by its alias:

```bash
cond scripts rm alias_name
```

Remove all by use clean command:

```bash
cond scripts clean
```
