# Vercel Environment Variables Setup Guide

## Required Environment Variables for Production

Copy these environment variables to your Vercel dashboard:

### Database
```
DATABASE_URL=postgresql://neondb_owner:npg_krLJf6Iash2T@ep-curly-flower-ad78nzra-pooler.c-2.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require

DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_krLJf6Iash2T@ep-curly-flower-ad78nzra.c-2.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

### Authentication
```
AUTH_SECRET=6HOgLAVgPI1SJyytWnk0n/UbvR4OR0TZsgMPgEwU6Ps=
NEXTAUTH_URL=https://your-app-name.vercel.app
```

### Prisma
```
PRISMA_GENERATE_SKIP_AUTOINSTALL=true
```

## Deployment Steps

1. **Push to GitHub/GitLab/Bitbucket**
2. **Import project to Vercel**
3. **Add environment variables in Vercel dashboard**
4. **Deploy**

## Important Notes

- The `postinstall` script will automatically run `prisma generate` after deployment
- Database migrations are handled by `prisma db push` in development
- For production, use `prisma migrate deploy` with proper migration files