# חיבור פיד Instagram אמיתי

האתר קורא את ששת הפרסומים האחרונים דרך פונקציית Vercel ב־`/api/instagram`.
ה־Access Token נשמר בצד השרת בלבד ואינו נשלח לדפדפן.

## דרישות

- חשבון Instagram מקצועי: Business או Creator.
- אפליקציית Meta שמורשית לגשת לחשבון.
- Access Token תקף של Instagram API.

## משתני סביבה ב־Vercel

ב־Project Settings → Environment Variables הגדירו:

```text
INSTAGRAM_ACCESS_TOKEN=<token>
INSTAGRAM_USER_ID=<instagram-user-id>
```

אופציונלי בלבד:

```text
INSTAGRAM_GRAPH_VERSION=v23.0
INSTAGRAM_GRAPH_BASE_URL=https://graph.instagram.com
```

לאחר שינוי משתני הסביבה יש לבצע Redeploy לפרודקשן.

## התנהגות בטוחה

- אם ה־API מחובר: מוצגים ששת הפוסטים/רילס האחרונים עם קישור לפוסט המקורי.
- אם ה־API לא מחובר או נכשל: האתר לא מציג תמונות מוצרים כאילו הגיעו מאינסטגרם. במקום זאת מוצג קישור ישיר לעמוד Instagram.
- ה־token אינו חלק מ־Vite ואינו משתמש במשתנה שמתחיל ב־`VITE_`.
