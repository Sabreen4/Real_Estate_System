import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, tap } from 'rxjs';
import { CacheService } from 'src/app/core/services/cache.service';

// ── Whitelisted URL segments ───────────────────────────────────────────────

const CACHEABLE_URLS = [
  '/properties',
  '/appointments',
  '/offers',
  '/payments',
  '/reports',
  '/users',
];

// ── Per-URL TTL overrides (ms) ─────────────────────────────────────────────

const TTL_OVERRIDES: Record<string, number> = {
  '/properties':   10 * 60 * 1000,
  '/appointments':  5 * 60 * 1000,
  '/offers':        5 * 60 * 1000,
};

// ── Helpers ───────────────────────────────────────────────────────────────

function isCacheable(url: string): boolean {
  return CACHEABLE_URLS.some(segment => url.includes(segment));
}

function getTtl(url: string): number {
  const match = Object.keys(TTL_OVERRIDES).find(k => url.includes(k));
  return match ? TTL_OVERRIDES[match] : 5 * 60 * 1000;
}

// ── Interceptor ───────────────────────────────────────────────────────────

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  const cacheService = inject(CacheService);

  if (req.method !== 'GET' || !isCacheable(req.url)) {
    return next(req);
  }

  const cacheKey = req.urlWithParams;
  const ttl      = getTtl(req.url);

  const cached = cacheService.getRawResponse(cacheKey);
  if (cached) {
    console.debug('[Cache HIT]', cacheKey);
    return of(cached.clone());
  }

  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse && event.status === 200) {
        console.debug('[Cache SET]', cacheKey);
        cacheService.setRawResponse(cacheKey, event, ttl);
      }
    })
  );
};