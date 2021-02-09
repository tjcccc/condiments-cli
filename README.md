# Condiments

A small cli tools (based on nodejs environment)

version: 1.0.0

## Installation

```bash
npm install -g condiments
// or
yarn add -g condiments
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

### List Files

After files saved, you can list them to the terminal:

```bash
cond files ls
```

### Remove and Clean Files

You can remove file or folder by its alias:

```bash
cond files rm alias_name
```

You can remove all by use clean command:

```bash
cond files clean
```

## Usage for Scripts

(Not ready)

### Save Scripts

### Run Saved Scripts

### List Scripts

### Remove and Clean Scripts
