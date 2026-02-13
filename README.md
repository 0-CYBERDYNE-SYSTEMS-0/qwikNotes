# QwikNotes

A simple macOS menu bar app for quick notes - AI prompts, API keys, and more.

## Features

-  5 quick notes in the menu bar
-  Notes persist between app restarts
-  Copy notes to clipboard with one click
-  Note 5 doubles as a clipboard manager (last 20 copies, searchable with arrow-key navigation)
-  Clear notes easily

## Setup

```bash
cd qwik_note
npm install
```

## Run Development

```bash
npm run dev
```

## Build App

```bash
npm run build   # Creates .app in dist/mac
```

## Usage

1. Click the  icon in your menu bar
2. Select a note (Note 1-5)
3. In the dropdown, use **Clipboard (Note 5)** to access rolling clipboard history
4. Click an item to open its editor window
5. In Clipboard (Note 5), search + arrow keys let you quickly find/copy prior clipboard entries
6. For regular notes, type/edit text as normal
7. Use "Copy" or "Clear" as needed
