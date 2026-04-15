# 🏢 ועד הבית — אפליקציית ניהול בית משותף

אפליקציית ניהול ועד בית עם מערכת חתימות אונליין ומעקב תשלומים.

## תכונות

- 📋 יצירת החלטות וחתימות אונליין
- 💰 מעקב תשלומים (₪300 לכל חודשיים) עם תזכורות
- 👥 ניהול דיירים לפי 3 כניסות (18 דירות)
- 🔐 שני סוגי משתמשים: חבר ועד (ניהול מלא) ודייר (צפייה + חתימה)
- ✍️ Signature pad אינטראקטיבי (מובייל + דסקטופ)

## התקנה

```bash
npm install
```

## הרצה מקומית

```bash
npm run dev
```

## בנייה לפרודקשן

```bash
npm run build
```

## דפלוי ל-Vercel

### אופציה 1: דרך GitHub (מומלץ)
1. צור ריפו חדש ב-GitHub
2. דחוף את הקוד:
   ```bash
   git init
   git add .
   git commit -m "vaad bayit app"
   git remote add origin https://github.com/YOUR_USER/vaad-bayit.git
   git push -u origin main
   ```
3. היכנס ל-[vercel.com](https://vercel.com) → New Project → Import מ-GitHub
4. Vercel יזהה אוטומטית שזה Vite → לחץ Deploy
5. תוך דקה האתר באוויר! 🎉

### אופציה 2: Vercel CLI
```bash
npm i -g vercel
vercel
```

## דפלוי ל-Cloudflare Pages
```bash
npm run build
# Upload the `dist` folder to Cloudflare Pages
```

## טכנולוגיות
- React 18
- Vite 6
- Noto Sans Hebrew
