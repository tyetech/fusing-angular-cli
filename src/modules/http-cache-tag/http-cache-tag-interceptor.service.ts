import { Inject, Injectable } from '@angular/core'
import {
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
  HttpEvent
} from '@angular/common/http'
import {
  CACHE_TAG_CONFIG,
  CACHE_TAG_FACTORY,
  CacheFactory,
  CacheTagConfig
} from './http-cache-tag.server.module'
import { map } from 'rxjs/operators'
import { Observable } from 'rxjs'

// tslint:disable:no-class
// tslint:disable:no-this
// tslint:disable:no-if-statement
@Injectable()
export class HttpCacheTagInterceptor implements HttpInterceptor {
  constructor(
    @Inject(CACHE_TAG_CONFIG) private config: CacheTagConfig,
    @Inject(CACHE_TAG_FACTORY) private factory: CacheFactory
  ) {
    if (!config.headerKey) throw new Error('missing config.headerKey')
    if (!config.cacheableResponseCodes)
      throw new Error('missing config.cacheableResponseCodes')
  }

  isCacheableCode(code: number) {
    return this.config.cacheableResponseCodes.find(a => a === code)
  }

  isCacheableUrl(url: string | null) {
    if (!this.config.cacheableUrls || !url || url === null) return true
    return this.config.cacheableUrls.test(url)
  }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      map(event => {
        if (
          event instanceof HttpResponse &&
          this.isCacheableCode(event.status) &&
          this.isCacheableUrl(event.url)
        ) {
          this.factory(event, this.config)
        }
        return event
      })
    )
  }
}
