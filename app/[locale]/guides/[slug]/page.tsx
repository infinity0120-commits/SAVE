import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Smartphone, Film, Settings2, Mail, HardDrive, Zap, CheckCircle2, Clock, FileVideo } from 'lucide-react';
import { locales, isLocale } from '@/lib/i18n-config';
import { getDictionary } from '@/lib/get-dictionary';
import { AdBanner } from '@/components/AdBanner';

export function generateStaticParams() {
  return locales.flatMap((locale) => [
    { locale, slug: 'iphone-video-compression' },
  ]);
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const dict = getDictionary(params.locale);
  if (params.locale === 'ko') {
    return {
      title: '아이폰 동영상 용량 줄이기 완벽 가이드 — ZipStor',
      description:
        '아이폰 동영상 용량을 줄이는 5가지 방법을 알아보세요. 앱 설치 없이 브라우저에서 바로 압축, 화질 손실 최소화, 이메일 전송, 저장 공간 확보까지.',
    };
  }
  return {
    title: 'How to Reduce iPhone Video File Size — Complete Guide | ZipStor',
    description:
      'Learn 5 proven ways to reduce iPhone video file size without losing quality. Compress directly in your browser, no apps, no uploads. Free and private.',
  };
}

export default function GuidePage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  if (!isLocale(params.locale)) notFound();
  if (params.slug !== 'iphone-video-compression') notFound();

  const dict = getDictionary(params.locale);
  const locale = params.locale;
  const isKo = locale === 'ko';

  const tocItems = isKo
    ? [
        '아이폰 동영상이 용량이 큰 이유',
        '방법 1: 브라우저 압축 도구 사용 (추천)',
        '방법 2: 아이폰 설정에서 비디오 해상도 변경',
        '방법 3: iMovie로 압축하기',
        '방법 4: 이메일 공유 시 자동 압축',
        '방법 5: 클라우드 서비스 활용',
        '아이폰 동영상 압축 팁 요약',
      ]
    : [
        'Why iPhone videos are so large',
        'Method 1: Use a browser compressor (recommended)',
        'Method 2: Change video resolution in iPhone settings',
        'Method 3: Compress with iMovie',
        'Method 4: Auto-compression when sharing via email',
        'Method 5: Cloud-based compression services',
        'Summary of iPhone video compression tips',
      ];

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      {/* Back link */}
      <Link
        href={`/${locale}/guides`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 transition-colors hover:text-sky-700 dark:text-sky-400"
      >
        <ArrowLeft className="h-4 w-4" />
        {dict.guides.backToGuides}
      </Link>

      {/* Title */}
      <h1 className="text-2xl font-bold leading-tight text-slate-900 dark:text-white md:text-4xl">
        {dict.guides.iphoneTitle}
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {dict.guides.iphoneLastUpdated}
      </p>

      {/* Intro */}
      <p className="mt-6 text-base leading-relaxed text-slate-700 dark:text-slate-300">
        {dict.guides.iphoneIntro}
      </p>

      {/* Top ad */}
      <AdBanner slot="top" className="mt-8 mb-8" />

      {/* Table of contents */}
      <nav className="mb-10 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
        <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
          {dict.guides.iphoneTOC}
        </p>
        <ol className="space-y-1.5">
          {tocItems.map((item, i) => (
            <li key={i}>
              <a
                href={`#section-${i + 1}`}
                className="flex items-start gap-2 text-sm text-sky-600 transition-colors hover:text-sky-700 dark:text-sky-400"
              >
                <span className="font-bold text-slate-400">{i + 1}.</span>
                <span>{item}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {isKo ? <KoreanContent locale={locale} /> : <EnglishContent locale={locale} />}
    </article>
  );
}

function EnglishContent({ locale }: { locale: string }) {
  return (
    <div className="space-y-8">
      <section id="section-1">
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
          Why iPhone videos are so large
        </h2>
        <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
          Modern iPhones record video in HEVC/H.265 or H.264 at resolutions up to 4K
          (3840×2160) and 60 frames per second. A single minute of 4K video at 60fps can
          consume <strong>400 MB or more</strong>. Even 1080p HD video at 60fps takes
          roughly <strong>170 MB per minute</strong>. The high bitrate and resolution
          produce stunning quality — but the resulting files are too large to email,
          message, or upload without compression.
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Resolution</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">FPS</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Size per minute</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr><td className="px-4 py-3 text-slate-700 dark:text-slate-300">4K (2160p)</td><td className="px-4 py-3 text-slate-700 dark:text-slate-300">60</td><td className="px-4 py-3 font-medium text-slate-900 dark:text-white">~400 MB</td></tr>
              <tr><td className="px-4 py-3 text-slate-700 dark:text-slate-300">4K (2160p)</td><td className="px-4 py-3 text-slate-700 dark:text-slate-300">30</td><td className="px-4 py-3 font-medium text-slate-900 dark:text-white">~170 MB</td></tr>
              <tr><td className="px-4 py-3 text-slate-700 dark:text-slate-300">1080p HD</td><td className="px-4 py-3 text-slate-700 dark:text-slate-300">60</td><td className="px-4 py-3 font-medium text-slate-900 dark:text-white">~100 MB</td></tr>
              <tr><td className="px-4 py-3 text-slate-700 dark:text-slate-300">1080p HD</td><td className="px-4 py-3 text-slate-700 dark:text-slate-300">30</td><td className="px-4 py-3 font-medium text-slate-900 dark:text-white">~60 MB</td></tr>
              <tr><td className="px-4 py-3 text-slate-700 dark:text-slate-300">720p HD</td><td className="px-4 py-3 text-slate-700 dark:text-slate-300">30</td><td className="px-4 py-3 font-medium text-slate-900 dark:text-white">~35 MB</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="section-2">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Recommended</span>
        </div>
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
          Method 1: Use a browser-based compressor
        </h2>
        <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
          The fastest and most private way to shrink an iPhone video is to use a
          browser-based tool like <strong>ZipStor</strong>. It runs FFmpeg compiled
          to WebAssembly directly in your browser — meaning your video never gets
          uploaded to any server. You simply open the website on your iPhone, select the
          video from your photo library, pick a compression preset, and download the
          smaller file.
        </p>
        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/50 p-5 dark:border-sky-900 dark:bg-sky-950/20">
          <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">Steps:</h3>
          <ol className="ml-4 list-decimal space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <li>Open <Link href={`/${locale}`} className="text-sky-600 underline">ZipStor</Link> in Safari or Chrome on your iPhone</li>
            <li>Tap the upload area and select a video from your photo library</li>
            <li>Choose a preset: <strong>Fast 720p</strong> for quick sharing, <strong>High Quality 1080p</strong> for best balance, or <strong>Target size &lt; 100 MB</strong> for email</li>
            <li>Tap "Start Compression" and wait for the progress bar to complete</li>
            <li>Tap "Download" to save the compressed video to your device</li>
          </ol>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {['No app install', '100% private', 'Free', 'Works offline after load'].map((tag) => (
            <span key={tag} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              {tag}
            </span>
          ))}
        </div>
      </section>

      <AdBanner slot="encoding" className="my-8" />

      <section id="section-3">
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
          Method 2: Change video resolution in iPhone settings
        </h2>
        <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
          You can prevent large files before they happen by changing your iPhone camera
          settings. Go to <strong>Settings → Camera → Record Video</strong> and select a
          lower resolution or frame rate. Switching from 4K at 60fps to 1080p at 30fps
          reduces file size by roughly <strong>85%</strong> while still producing
          high-quality video suitable for most purposes.
        </p>
      </section>

      <section id="section-4">
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
          Method 3: Compress with iMovie
        </h2>
        <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
          Apple's free iMovie app can export videos at reduced quality. Open iMovie,
          create a new project, import your video, then tap the export button and choose
          a lower resolution (e.g., 720p or 540p). This works but requires installing an
          app and manually editing — a browser tool is faster for simple compression.
        </p>
      </section>

      <section id="section-5">
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
          Method 4: Auto-compression when sharing via email
        </h2>
        <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
          When you share a video via the Mail app, iPhone automatically compresses it to
          fit email size limits. However, this gives you no control over quality and
          often produces very low-resolution output. It is only useful for quick,
          low-quality sharing.
        </p>
      </section>

      <section id="section-6">
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
          Method 5: Cloud-based compression services
        </h2>
        <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
          Some websites offer video compression by uploading your file to their servers.
          While effective, this raises <strong>privacy concerns</strong> — your video
          leaves your device and is processed on someone else's computer. Browser-based
          tools like ZipStor that use WebAssembly are strictly better for privacy
          because the file never leaves your phone.
        </p>
      </section>

      <section id="section-7">
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
          Summary of iPhone video compression tips
        </h2>
        <div className="space-y-2">
          {[
            'For one-time compression, use ZipStor — fast, private, no app needed',
            'For future recordings, lower your iPhone camera resolution in Settings',
            'Avoid email-based compression — quality is too low',
            'Be cautious with cloud services — your videos leave your device',
            'Keep the original file as a backup until you verify the compressed result',
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300">{tip}</span>
            </div>
          ))}
        </div>
      </section>

      <AdBanner slot="bottom" className="mt-8" />

      <div className="mt-8 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 p-6 text-center text-white shadow-lg shadow-sky-500/30">
        <h2 className="text-lg font-bold md:text-xl">Ready to compress your video?</h2>
        <p className="mt-1 text-sm text-sky-50">No sign-up. No upload. No app install.</p>
        <Link
          href={`/${locale}`}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-sky-600 transition-transform hover:scale-105 active:scale-95"
        >
          <FileVideo className="h-4 w-4" />
          Start Compressing Now
        </Link>
      </div>
    </div>
  );
}

function KoreanContent({ locale }: { locale: string }) {
  return (
    <div className="space-y-8">
      <section id="section-1">
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
          아이폰 동영상이 용량이 큰 이유
        </h2>
        <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
          최신 아이폰은 HEVC/H.265 또는 H.264 코덱으로 최대 4K(3840×2160) 해상도,
          60프레임으로 동영상을 촬영합니다. 4K 60fps 동영상은 1분당
          <strong> 400MB 이상</strong>을 차지하며, 1080p 60fps도 분당 약
          <strong> 170MB</strong>에 달합니다. 높은 비트레이트와 해상도가 뛰어난
          화질을 만들지만, 그만큼 파일이 커져서 이메일 전송, 메시지 공유, 업로드가
          어려워집니다.
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">해상도</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">FPS</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">분당 용량</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr><td className="px-4 py-3 text-slate-700 dark:text-slate-300">4K (2160p)</td><td className="px-4 py-3 text-slate-700 dark:text-slate-300">60</td><td className="px-4 py-3 font-medium text-slate-900 dark:text-white">~400 MB</td></tr>
              <tr><td className="px-4 py-3 text-slate-700 dark:text-slate-300">4K (2160p)</td><td className="px-4 py-3 text-slate-700 dark:text-slate-300">30</td><td className="px-4 py-3 font-medium text-slate-900 dark:text-white">~170 MB</td></tr>
              <tr><td className="px-4 py-3 text-slate-700 dark:text-slate-300">1080p HD</td><td className="px-4 py-3 text-slate-700 dark:text-slate-300">60</td><td className="px-4 py-3 font-medium text-slate-900 dark:text-white">~100 MB</td></tr>
              <tr><td className="px-4 py-3 text-slate-700 dark:text-slate-300">1080p HD</td><td className="px-4 py-3 text-slate-700 dark:text-slate-300">30</td><td className="px-4 py-3 font-medium text-slate-900 dark:text-white">~60 MB</td></tr>
              <tr><td className="px-4 py-3 text-slate-700 dark:text-slate-300">720p HD</td><td className="px-4 py-3 text-slate-700 dark:text-slate-300">30</td><td className="px-4 py-3 font-medium text-slate-900 dark:text-white">~35 MB</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="section-2">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">추천</span>
        </div>
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
          방법 1: 브라우저 압축 도구 사용
        </h2>
        <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
          아이폰 동영상 용량을 줄이는 가장 빠르고 안전한 방법은
          <strong> ZipStor</strong> 같은 브라우저 기반 도구를 사용하는
          것입니다. FFmpeg를 WebAssembly로 브라우저에서 직접 실행하므로 동영상이
          어떤 서버에도 업로드되지 않습니다. 아이폰에서 웹사이트를 열고, 사진
          앨범에서 동영상을 선택하고, 압축 프리셋을 고르고, 더 작은 파일을
          다운로드하면 됩니다.
        </p>
        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/50 p-5 dark:border-sky-900 dark:bg-sky-950/20">
          <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">사용 순서:</h3>
          <ol className="ml-4 list-decimal space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <li>아이폰 사파리 또는 크롬에서 <Link href={`/${locale}`} className="text-sky-600 underline">ZipStor</Link> 열기</li>
            <li>업로드 영역을 탭하고 사진 앨범에서 동영상 선택</li>
            <li>프리셋 선택: <strong>빠른 720p</strong>(빠른 공유), <strong>고화질 1080p</strong>(최적 균형), <strong>목표 용량 &lt; 100 MB</strong>(이메일용)</li>
            <li>"압축 시작"을 탭하고 진행률 바가 완료될 때까지 대기</li>
            <li>"다운로드"를 탭하여 압축된 동영상을 기기에 저장</li>
          </ol>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {['앱 설치 불필요', '100% 프라이빗', '무료', '로딩 후 오프라인 작동'].map((tag) => (
            <span key={tag} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              {tag}
            </span>
          ))}
        </div>
      </section>

      <AdBanner slot="encoding" className="my-8" />

      <section id="section-3">
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
          방법 2: 아이폰 설정에서 비디오 해상도 변경
        </h2>
        <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
          촬영 전에 아이폰 카메라 설정을 변경하여 큰 파일을 원천 방지할 수 있습니다.
          <strong> 설정 → 카메라 → 비디오 녹화</strong>로 이동하여 낮은 해상도나
          프레임 속도를 선택하세요. 4K 60fps에서 1080p 30fps로 변경하면 파일 크기를
          약 <strong>85%</strong> 줄일 수 있으며, 대부분의 용도에 충분한 화질을
          유지합니다.
        </p>
      </section>

      <section id="section-4">
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
          방법 3: iMovie로 압축하기
        </h2>
        <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
          Apple의 무료 iMovie 앱으로 동영상을 낮은 화질로 내보낼 수 있습니다.
          iMovie를 열고 새 프로젝트를 만들어 동영상을 불러온 뒤, 내보내기 버튼을
          탭하고 낮은 해상도(예: 720p 또는 540p)를 선택하세요. 작동은 하지만 앱
          설치와 수동 편집이 필요하므로 간단한 압축에는 브라우저 도구가 더
          빠릅니다.
        </p>
      </section>

      <section id="section-5">
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
          방법 4: 이메일 공유 시 자동 압축
        </h2>
        <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
          메일 앱으로 동영상을 공유하면 아이폰이 이메일 크기 제한에 맞춰 자동으로
          압축합니다. 하지만 화질을 직접 조절할 수 없고, 결과물 화질이 매우
          낮습니다. 빠르고 저화질 공유에만 유용합니다.
        </p>
      </section>

      <section id="section-6">
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
          방법 5: 클라우드 기반 압축 서비스
        </h2>
        <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
          일부 웹사이트는 파일을 서버에 업로드하여 압축합니다. 효과적이지만
          <strong> 프라이버시 우려</strong>가 있습니다 — 동영상이 기기를 떠나 다른
          사람의 컴퓨터에서 처리됩니다. WebAssembly를 사용하는 ZipStor 같은
          브라우저 도구가 프라이버시 측면에서 확실히 우수합니다. 파일이 폰에서
          절대 떠나지 않기 때문입니다.
        </p>
      </section>

      <section id="section-7">
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
          아이폰 동영상 압축 팁 요약
        </h2>
        <div className="space-y-2">
          {[
            '일회성 압축에는 ZipStor 사용 — 빠르고, 안전하고, 앱 불필요',
            '향후 촬영을 위해 아이폰 카메라 해상도를 설정에서 낮추기',
            '이메일 기반 압축은 피하기 — 화질이 너무 낮음',
            '클라우드 서비스는 주의 — 동영상이 기기를 떠남',
            '압축 결과를 확인하기 전까지 원본 파일을 백업으로 보관',
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300">{tip}</span>
            </div>
          ))}
        </div>
      </section>

      <AdBanner slot="bottom" className="mt-8" />

      <div className="mt-8 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 p-6 text-center text-white shadow-lg shadow-sky-500/30">
        <h2 className="text-lg font-bold md:text-xl">지금 바로 동영상을 압축해 보세요</h2>
        <p className="mt-1 text-sm text-sky-50">가입 없음. 업로드 없음. 앱 설치 없음.</p>
        <Link
          href={`/${locale}`}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-sky-600 transition-transform hover:scale-105 active:scale-95"
        >
          <FileVideo className="h-4 w-4" />
          압축 시작하기
        </Link>
      </div>
    </div>
  );
}
