
# 🧠 DAILY GPT AUTO-SYNC INSTRUCTION MANUAL (FOR NON-TECH STAFF)

📅 Last Updated: 2025-06-24 11:18:18

This guide is for employees with **no technical experience**. You do not need to know GitHub, coding, or even how Bash works. This will walk you through every step needed to:

- Start the GPT Auto-Sync system every morning
- Ensure it's running properly in the background
- Confirm files synced to every VIPTwisted GitHub repo
- Troubleshoot issues without assistance
- Confirm error-free operation using simple copy/paste checks

---

## 🚀 STEP 1 — OPEN GIT BASH

- Click your **Start Menu**
- Type: `Git Bash`
- Click the `Git Bash` icon  
(You’ll see a black terminal window open)

---

## 🔁 STEP 2 — START THE AUTO-SYNC SYSTEM (IN BACKGROUND)

Paste this command into the Git Bash window and press Enter:

```bash
cd /c/Users/globa/Toy-Party && nohup node full_auto_stack_loop.js > logs/loop.log 2>&1 &
```

✅ This:
- Starts the automatic sync system
- Runs silently in the background
- Syncs all repos every 10 minutes
- Logs results to `logs/loop.log`

💡 You can now **close Git Bash** — the system keeps running.

---

## 🧪 STEP 3 — OPTIONAL TEST (Confirm Immediately)

To manually confirm everything works (recommended daily):

Paste this:

```bash
cd /c/Users/globa/Toy-Party && node full_auto_stack.js
```

✅ You’ll see messages like:

```
Checking GPTAnalytics
GPTAnalytics pushed to GitHub.
...
FULL AUTO STACK COMPLETE
```

---

## 📂 STEP 4 — CONFIRM FILES DEPLOYED (BY NAME)

To see what files were deployed:

```bash
cat logs/sync-results.md | grep pushed
```

To check if a specific file was pushed (e.g. `README.md`):

```bash
cat logs/sync-results.md | grep README.md
```

To see pushes for a folder (e.g. `frontend/`):

```bash
cat logs/sync-results.md | grep frontend/
```

---

## 🧠 STEP 5 — CHECK IF AUTO-SYNC LOOP IS STILL RUNNING

Paste:

```bash
ps aux | grep full_auto_stack_loop.js
```

✅ If you see a line with `node full_auto_stack_loop.js`, the background system is active.

---

## 🔍 STEP 6 — CHECK FOR ERRORS

Paste this:

```bash
cat logs/error-log.md
```

✅ Good: The file says nothing or:

```
# Cleared on repair – ...
```

❌ Bad: You see lines like:
- `Push failed`
- `is missing Git`
- `hasn’t committed in 6+ hours`

📢 If you see those, tell your manager or support.

---

## 🔧 TROUBLESHOOTING QUICK FIXES

| Problem | Solution |
|--------|----------|
| Nothing syncing | Run: `node full_auto_stack.js` |
| File didn’t push | Check spelling in logs/sync-results.md |
| Errors show up | Run: `node scripts/auto-repair.js` then re-sync |
| Want to clear error log | Run: `echo "Cleared" > logs/error-log.md` |

---


---

## 📋 STEP 7 — VERIFY WHAT FILES WERE PUSHED (BY NAME)

Paste this into Git Bash:

```bash
cat logs/sync-results.md | grep "pushed to"
```

✅ This shows every file name and which repo it was pushed to.  
If nothing shows up, then no files were deployed in that run.

---
## 📓 DAILY CHECKLIST

✅ Open Git Bash  
✅ Paste the startup command  
✅ Run optional test  
✅ Check sync-results.md (optional)  
✅ Check error-log.md (optional)  
✅ You’re done!

---

## ❌ NEVER DO:

- ❌ Double-click `.js` files from File Explorer  
- ❌ Open `.bat` files manually  
- ❌ Rename folders inside `Toy-Party/`

---

## 📬 NEED HELP?

Email: sinphoriastudio@gmail.com  
Or notify the GPT Sync Admin team

---

✅ Deployment test at 2025-06-24 7:48 PM

