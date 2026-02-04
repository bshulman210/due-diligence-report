# Due Diligence Search Report Generator

A simple web tool that searches Google for potential risk indicators associated with a person's name and location, then compiles the results into a downloadable PDF report.

---

## What This Tool Does

You enter a person's **name** and **city/state**. The tool runs 3 Google searches using different risk-related keyword combinations (fraud, criminal charges, lawsuits, etc.) via the Serper API, and compiles the results — including titles, URLs, and snippets — into a single PDF report you can download.

---

## Prerequisites

You need the following installed on your computer before you can use this tool.

### On macOS

1. **PHP** (version 8.2–8.4 recommended)
   - Open Terminal and type: `php -v`
   - If not installed: `brew install php@8.4`
   - (If you don't have Homebrew, install it first from https://brew.sh)

2. **Composer** (PHP package manager)
   - Open Terminal and type: `composer --version`
   - If not installed: `brew install composer`

### On Windows

1. **PHP** (version 8.2–8.4 recommended)
   - Download from https://windows.php.net/download/
   - Or install via Chocolatey: `choco install php`

2. **Composer**
   - Download the installer from https://getcomposer.org/download/
   - Run the installer and follow the prompts

> **Note:** `npm install` is **not** required to run this project.

---

## Installation (One-Time Setup)

Open your Terminal (macOS) or Command Prompt (Windows) and run these commands one at a time:

```bash
# 1. Navigate to the project folder
cd /path/to/this/project

# 2. Install PHP dependencies
composer install

# 3. Copy the environment file (if .env doesn't already exist)
cp .env.example .env

# 4. Generate the application key
php artisan key:generate
```

---

## How to Run the App

1. Open Terminal (macOS) or Command Prompt (Windows)

2. Navigate to the project folder:
   ```bash
   cd /path/to/this/project
   ```

3. Start the server:
   ```bash
   php artisan serve
   ```

4. You should see a message like:
   ```
   INFO  Server running on [http://127.0.0.1:8000].
   ```

5. Open your web browser and go to: **http://localhost:8000**

6. To stop the server when you're done, press `Ctrl+C` in the Terminal.

---

## How to Use

1. Open **http://localhost:8000** in your browser
2. Enter the person's **Full Name** (e.g., "John Smith")
3. Enter their **City** (e.g., "Tampa")
4. Enter their **State** (e.g., "Florida")
5. Click **Generate Report**
6. Wait a few seconds for the report to process (a loading spinner will appear)
7. A PDF file will automatically download to your computer
8. Open the PDF to review the search results

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Command not found: php" | PHP is not installed. See Prerequisites above. |
| "Command not found: composer" | Composer is not installed. See Prerequisites above. |
| "Serper API key is not configured" | Open `.env` and make sure `SERPER_API_KEY` is filled in. |
| "Serper API error" | Your API key may be incorrect or your free credits may be used up. Check your dashboard at https://serper.dev. |
| Server won't start | Make sure nothing else is running on port 8000. Try: `php artisan serve --port=8080` |
| "Class not found" errors | Run `composer install` again from the project folder. |
| PDO::MYSQL_ATTR_SSL_CA deprecation warnings | You're on PHP 8.5+. These warnings are harmless, but to avoid them, downgrade to PHP 8.4: `brew install php@8.4 && brew unlink php && brew link php@8.4` |
