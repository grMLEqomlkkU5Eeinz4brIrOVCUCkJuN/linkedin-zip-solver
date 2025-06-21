# 🧩 Zip Solver (for LinkedIn's Daily Puzzle)

A JavaScript-based [solver](https://grmleqomlkku5eeinz4brirovcuckjun.github.io/linkedin-zip-solver/) for [Zip](https://www.linkedin.com/help/linkedin/answer/a7445030), LinkedIn’s daily logic puzzle. This tool automates solving the path-based game by computing valid paths that:

1. Connect numbered cells in ascending order,
2. Fill every cell exactly once,
3. Respect wall boundaries between cells.

---

## 📌 What is Zip?

**Zip** is a visual pathfinding puzzle published daily on LinkedIn. The objective:
- Draw a single path from cell **1** to the final number (e.g., 35),
- Visit all grid cells exactly once,
- Do not cross walls between adjacent cells.

![Demo of zip](https://media.licdn.com/dms/image/v2/D4D08AQGRhPVQFFCTtA/croft-frontend-shrinkToFit1920/B4DZWJZxAdHIAc-/0/1741766991484?e=1751137200&v=beta&t=970kEZHgXtnPOJmOvVf0a6kD7eHpZMEl_9kqNJMbLH8)

More on Zip: [LinkedIn Help Center – Zip](https://www.linkedin.com/help/linkedin/answer/a7445030)

---

## 🚀 Project Goals

This project aims to:
- Parse a Zip puzzle grid representation,
- Apply pathfinding algorithms to find valid Zip solutions,
- Support interactive debugging or automated solving in Node.js.

---

## ⚙️ Setup & Usage

### 🛠 Requirements

- Node.js (v16+ recommended)

### 📥 Install

Clone the repo:

```bash
git clone repo-url-here
cd zip-solver-js
```


### Project Structure
`table.js` is the source code put together as one file to help people who want to understand how it works. Whereas, the `public` folder is the folder that contains the html pages to solve the puzzles for you.