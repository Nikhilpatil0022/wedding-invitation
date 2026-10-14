# Wedding Invitation Website

A responsive, cinematic wedding invitation built with plain HTML, CSS, and JavaScript. It is designed for GitHub Pages; there is no build step, backend, database, or package installation.

## Preview locally

1. Download or unzip the project.
2. Open `index.html` in a modern browser.
3. For a more realistic local-hosted test, use VS Code's Live Server extension. You do not need it for GitHub Pages.

The page uses Google Fonts and GSAP from CDNs and temporary couple photos from Unsplash, so those assets need an internet connection. If any remote photo changes or becomes unavailable, replace its URL in `js/config.js` with your own image path.

## Personalize the invitation

Open `js/config.js` and update:

- `partnerOne` and `partnerTwo`
- `shortDate` and `longDate`
- `time`, `venue`, `address`, and `city`
- `mapUrl` (optional; if left blank, a Google Maps search is generated from `address`)

For example, a local photo path can be `assets/images/hero.jpg`. Put your photo in `assets/images/` and change the related `images` value in `js/config.js`.

## Add your pre-wedding video

1. Export a landscape MP4, ideally 1920×1080 or 1280×720, H.264 video, and a moderate bitrate so mobile visitors can load it.
2. Name it exactly `love-story.mp4`.
3. Put it at `assets/videos/love-story.mp4`.
4. Commit and push the file.

The video is **scrubbed by scroll position**: scrolling down advances through the video and scrolling up reverses it. A temporary image is shown until the MP4 can be loaded. Scrubbing is most fluid when the MP4 has frequent keyframes and is encoded for web playback. Large video files can make GitHub repositories heavy; keep the file reasonably optimized. GitHub Pages sites are static hosts, not video transcoding services.

## Publish on GitHub Pages

1. Create a GitHub repository, for example `wedding-invitation`.
2. Upload all files and folders from this project to the repository root (so `index.html` is in the root).
3. Commit and push to the `main` branch.
4. Open the repository's **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/(root)`, then save.
6. Wait for deployment. GitHub will show the live URL in the Pages settings.

A project site URL usually looks like `https://YOUR-USERNAME.github.io/wedding-invitation/`. Relative paths are used in this project, so it works from a repository subpath as well as from a custom domain.

## Temporary photo credits

The initial couple photographs are loaded from Unsplash and can be replaced at any time:

- Hero image: [A man and woman standing under a canopy of flowers](https://unsplash.com/photos/a-man-and-woman-standing-under-a-canopy-of-flowers-ykcXm_u84sg) by shades by 43.
- Film poster: [Couple kissing during daytime](https://unsplash.com/photos/couple-kissing-during-daytime-6X3c8kxj1Y8) by d i e g o Authentic.
- Our-next-chapter image: [Couple sharing a tender moment on a wedding day](https://unsplash.com/photos/couple-sharing-a-tender-moment-on-a-wedding-day-vtTT7THRmA8) by Céline Druguet.

These are temporary demonstration images, not photographs of the couple receiving this invitation.
