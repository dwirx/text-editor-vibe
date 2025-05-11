# PWA Icon Replacement Instructions

For the text editor to be properly installable as a Progressive Web App (PWA), you should replace the placeholder icon files with your own custom icons.

## Required Icons

1. **Icon-192x192.png** - A 192x192 pixel PNG image for app icons on mobile devices
2. **Icon-512x512.png** - A 512x512 pixel PNG image for larger displays and app stores

## Steps to Replace Icons

1. Create your own square app icons in the sizes mentioned above
2. Replace the existing placeholder files in the `/public/icons/` directory:
   - `/public/icons/icon-192x192.png`
   - `/public/icons/icon-512x512.png`

## Recommended Icon Design

- Use a simple, recognizable design with minimal details
- Ensure good contrast with various backgrounds
- Include some padding around the edges
- Use PNG format with transparency
- Test your icons on both light and dark backgrounds

## After Replacing Icons

After replacing the icons, rebuild your application with:

```bash
npm run build
npm start
```

Your PWA will now display your custom icons when installed on devices.

## Icon Generation Tools

- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator) - Generate icons from a single source image
- [Favicon Generator](https://realfavicongenerator.net/) - Generate comprehensive favicon packages
- [Figma](https://www.figma.com/) - Design custom icons from scratch

If you don't replace these icons, the app will still work, but it will display the placeholder icons when installed. 