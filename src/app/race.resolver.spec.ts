import { fakeAsync, ComponentFixture, TestBed, tick } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, Params, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';

import { RaceResolver } from './race.resolver';
import { RaceService } from './race.service';
import { RaceModel } from './models/race.model';
import { AppModule } from './app.module';
import { RacesModule } from './races/races.module';
import { RACES_ROUTES } from './races/races.routes';
import { AppComponent } from './app.component';

describe('RaceResolver', () => {
  let appComponentFixture: ComponentFixture<AppComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppModule, RacesModule]
    });

    // override the lazy loaded module
    const router = TestBed.inject(Router);
    router.resetConfig([{ path: 'races', children: RACES_ROUTES }]);

    appComponentFixture = TestBed.createComponent(AppComponent);
    appComponentFixture.detectChanges();
  });

  it('should resolve race using the raceId route parameter', () => {
    const raceService = TestBed.inject(RaceService);
    const expectedResult: Observable<RaceModel> = EMPTY;

    spyOn(raceService, 'get').and.returnValue(expectedResult);

    const resolver = TestBed.inject(RaceResolver);

    const params = { raceId: '42' } as Params;
    const paramMap = convertToParamMap(params);

    const routeSnapshot = { params, paramMap } as ActivatedRouteSnapshot;
    const result = resolver.resolve(routeSnapshot, {} as RouterStateSnapshot);

    expect(result).withContext('The resolver should call return a race').toBe(expectedResult);
    expect(+(raceService.get as jasmine.Spy).calls.argsFor(0)[0])
      .withContext('The resolver should call the RaceService.get method with the id')
      .toBe(42);
  });

  it('should be applied on the bet route', fakeAsync(() => {
    const resolver = TestBed.inject(RaceResolver);
    spyOn(resolver, 'resolve').and.returnValue(of({ id: 42, startInstant: '2020-02-18T08:02:00Z' } as RaceModel));

    const router = TestBed.inject(Router);
    router.navigateByUrl('/races/42');

    tick();
    appComponentFixture.detectChanges();
    expect(resolver.resolve).toHaveBeenCalled();
  }));

  it('should be applied on the live route', fakeAsync(() => {
    const resolver = TestBed.inject(RaceResolver);
    spyOn(resolver, 'resolve').and.returnValue(of({ id: 42 } as RaceModel));
    const raceService = TestBed.inject(RaceService);
    spyOn(raceService, 'live').and.returnValue(of([]));

    const router = TestBed.inject(Router);
    router.navigateByUrl('/races/42/live');

    tick();
    appComponentFixture.detectChanges();
    expect(resolver.resolve).toHaveBeenCalled();
  }));
});
