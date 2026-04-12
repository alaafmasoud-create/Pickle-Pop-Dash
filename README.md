# Pickle Pop Dash

A light, fun, browser-ready online game built with **HTML**, **CSS**, and **vanilla JavaScript**.

The player controls a heroic pickle, dodges falling hazards, collects stars, grabs shields, and tries to beat the local high score.

![Pickle Pop Dash cover](assets/cover.svg)

##  It supports both **desktop** and **mobile** controls.

## Features

- Responsive online game interface
- HTML5 Canvas gameplay
- Keyboard controls
- Touch controls for phones and tablets
- Pause / resume
- Background music with on / off toggle
- Sound effects on / off
- Fullscreen button
- Local high score storage with `localStorage`
- Progressive difficulty scaling
- Self-contained project with no external assets required

## Controls

### Desktop
- **Left Arrow**: move left
- **Right Arrow**: move right
- **Shift**: boost
- **Space**: start or pause
- **P**: pause / resume
- **M**: sound on / off
- **F**: fullscreen

### Mobile
- Use the on-screen **left**, **boost**, and **right** buttons
- Drag across the canvas to reposition the player on smaller screens

## Project structure

```text
pickle-pop-dash/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml
├── assets/
│   ├── cover.svg
│   └── favicon.svg
├── css/
│   └── styles.css
├── js/
│   └── game.js
├── .gitignore
├── index.html
├── LICENSE
└── README.md
```

## Run locally

Because this is a static web project, you can open `index.html` directly in your browser.

For a cleaner local test, you can also use a small local server.

### Python

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Deploy online with GitHub Pages

### Option 1: manual GitHub Pages

1. Create a new GitHub repository.
2. Upload all project files.
3. Go to **Settings → Pages**.
4. Set the source to **Deploy from a branch**.
5. Choose the `main` branch and the root folder.
6. Save.

### Option 2: GitHub Actions workflow included

This project already includes a GitHub Pages workflow in:

```text
.github/workflows/deploy-pages.yml
```

If you enable Pages in the repository, GitHub can deploy the game automatically.

## Ideas for future improvements

- Add more player skins
- Add a combo system
- Add a boss round every few levels
- Add a leaderboard backend
- Add collectible coins and a shop

## License

This project is released under the **MIT License**.

## Author

Built by A. Masoud
