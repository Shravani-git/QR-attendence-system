# QR Attendance System

This project is a mobile-first, React-based QR attendance system designed for simplicity and efficiency. It enables users to generate QR codes, scan them for attendance tracking, and manage attendance data with a lightweight, responsive interface.

## Features

*   **QR Code Generation**:
    *   Generate individual QR codes.
    *   Support for batch QR generation using numerical ranges or CSV input. This leverages libraries like `fill-range` and `to-regex-range` for robust range parsing.
    *   Download generated QRs as PNG images or print them directly.

*   **Mobile-First Scanning**:
    *   Responsive design ensures a seamless experience on various mobile devices.
    *   **Throttled Scanning**: Implements a mechanism to prevent rapid, repeated attendance toggles, featuring a short cooldown period per scan.

*   **Attendance Management**:
    *   Attendance data is persisted locally using `localStorage`, complete with versioning to manage data integrity.
    *   Export the current attendance snapshot to a CSV file.

*   **User Interface & Experience**:
    *   Built with **Plain React JavaScript** (no TypeScript) for straightforward development.
    *   **Lightweight UI** styled with **Tailwind CSS** for a clean and modern look.
    *   **Accessibility-minded** design, ensuring interactive elements like buttons and labels are user-friendly.

## Technical Highlights

The project utilizes a modern JavaScript ecosystem, including:

*   **React**: For building dynamic and interactive user interfaces.
*   **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
*   **Module Bundling**: `Rollup` is used for efficient JavaScript module bundling, optimizing the application for deployment.
*   **File System Operations**: For potential future enhancements or local data management, the `@humanfs/node` library provides a consistent API for file system interactions, complemented by `fast-glob` for pattern-based file discovery and `normalize-path` for cross-platform path handling.
*   **Robust Input Handling**: Libraries like `fill-range`, `to-regex-range`, `is-number`, and `is-glob` ensure accurate and validated processing of user inputs, especially for batch operations.
*   **Error Handling & Retries**: The `@humanwhocodes/retry` utility is available to enhance the reliability of asynchronous operations, particularly useful for network requests or file system interactions that might encounter transient errors.
*   **Command-Line Utilities**: `jackspeak` suggests a robust command-line interface for development or administrative tasks, allowing for strict argument parsing and configuration management.

## Installation and Setup

```bash
# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

## Running the Project

```bash
# Start the development server
npm start
```

## Security Note

This project is currently a **local prototype**. For production deployment, it is crucial to implement server-side validation, signed tokens, and robust user authentication mechanisms to ensure data security and integrity.