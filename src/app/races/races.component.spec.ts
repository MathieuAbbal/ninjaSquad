import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router, RouterOutlet } from '@angular/router';
import { Location } from '@angular/common';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { AppModule } from '../app.module';
import { RacesModule } from './races.module';
import { RacesComponent } from './races.component';
import { AppComponent } from '../app.component';
import { PendingRacesComponent } from './pending-races/pending-races.component';
import { RacesResolver } from '../races.resolver';
import { FinishedRacesComponent } from './finished-races/finished-races.component';
import { RACES_ROUTES } from './races.routes';

describe('RacesComponent', () => {
  let appComponentFixture: ComponentFixture<AppComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppModule, RacesModule]
    });

    const racesResolver = TestBed.inject(RacesResolver);
    spyOn(racesResolver, 'resolve').and.returnValue(of([]));

    // override the lazy loaded module
    const router = TestBed.inject(Router);
    router.resetConfig([{ path: 'races', children: RACES_ROUTES }]);

    appComponentFixture = TestBed.createComponent(AppComponent);
    appComponentFixture.detectChanges();
  });

  it('should redirect from /races to /races/pending', fakeAsync(() => {
    const router = TestBed.inject(Router);
    router.navigateByUrl('/races');

    tick();

    const location = TestBed.inject(Location);
    expect(location.path()).withContext('You should redirect from /races to /races/pending').toBe('/races/pending');
  }));

  it('should show two tabs', fakeAsync(() => {
    const router = TestBed.inject(Router);
    router.navigateByUrl('/races');

    tick();
    appComponentFixture.detectChanges();

    const racesComponent = appComponentFixture.debugElement.query(By.directive(RacesComponent));

    const tabLinks = racesComponent.nativeElement.querySelectorAll('.nav.nav-tabs .nav-item a.nav-link');
    expect(tabLinks.length).withContext('You should have two tabs, one for pending races, one for the finished races').toBe(2);
    expect(tabLinks[0].href).toContain('/races/pending');
    expect(tabLinks[1].href).toContain('/races/finished');
  }));

  it('should have a router outlet', fakeAsync(() => {
    const router = TestBed.inject(Router);
    router.navigateByUrl('/races');

    tick();

    const racesComponent = appComponentFixture.debugElement.query(By.directive(RacesComponent));
    const outlet = racesComponent.query(By.directive(RouterOutlet));

    expect(outlet).withContext('You must have a router-outlet in your template').not.toBeNull();
  }));

  it('should have make first tab active when showing pending races', fakeAsync(() => {
    const router = TestBed.inject(Router);
    router.navigateByUrl('/races');

    tick();
    appComponentFixture.detectChanges();
    tick();

    const racesComponent = appComponentFixture.debugElement.query(By.directive(RacesComponent));
    const links = racesComponent.nativeElement.querySelectorAll('a.nav-link');
    expect(links.length).withContext('You must have two links').toBe(2);
    expect(links[0].className.split(' ')).withContext('The first link should be active').toContain('active');
    expect(links[1].className.split(' ')).not.withContext('The second link should not be active').toContain('active');
  }));

  it('should have make second tab active when showing finished races', fakeAsync(() => {
    const router = TestBed.inject(Router);
    router.navigateByUrl('/races/finished');

    tick();
    appComponentFixture.detectChanges();
    tick();

    const racesComponent = appComponentFixture.debugElement.query(By.directive(RacesComponent));
    const links = racesComponent.nativeElement.querySelectorAll('a.nav-link');
    expect(links.length).withContext('You must have two links').toBe(2);
    expect(links[0].className.split(' ')).not.withContext('The first link should not be active').toContain('active');
    expect(links[1].className.split(' ')).withContext('The second link should be active').toContain('active');
  }));

  it('should display pending races in first tab', fakeAsync(() => {
    const router = TestBed.inject(Router);
    router.navigateByUrl('/races');

    tick();

    const pendingRacesComponent = appComponentFixture.debugElement.query(By.directive(PendingRacesComponent));
    const finishedRacesComponent = appComponentFixture.debugElement.query(By.directive(FinishedRacesComponent));

    expect(pendingRacesComponent)
      .withContext('The router should display the PendingRacesComponent in the first tab for /races')
      .not.toBeNull();
    expect(finishedRacesComponent).withContext('The router should not display the FinishedRacesComponent for /races').toBeNull();
  }));

  it('should display finished races in second tab', fakeAsync(() => {
    const router = TestBed.inject(Router);
    router.navigateByUrl('/races/finished');

    tick();

    const pendingRacesComponent = appComponentFixture.debugElement.query(By.directive(PendingRacesComponent));
    const finishedRacesComponent = appComponentFixture.debugElement.query(By.directive(FinishedRacesComponent));

    expect(pendingRacesComponent).withContext('The router should not display the PendingRacesComponent for /races/finished').toBeNull();
    expect(finishedRacesComponent).withContext('The router should display the FinishedRacesComponent for /races/finished').not.toBeNull();
  }));

  it('should navigate when clicking on second tab', fakeAsync(() => {
    const router = TestBed.inject(Router);
    router.navigateByUrl('/races');

    tick();
    appComponentFixture.detectChanges();

    const racesComponent = appComponentFixture.debugElement.query(By.directive(RacesComponent));
    racesComponent.nativeElement.querySelectorAll('a')[1].click();

    tick();
    appComponentFixture.detectChanges();

    const location = TestBed.inject(Location);

    expect(location.path()).withContext('You must navigate to /races/finished when clicking on the second tab').toBe('/races/finished');
  }));

  it('should navigate when clicking on second tab', fakeAsync(() => {
    const router = TestBed.inject(Router);
    router.navigateByUrl('/races/finished');

    tick();
    appComponentFixture.detectChanges();

    const racesComponent = appComponentFixture.debugElement.query(By.directive(RacesComponent));
    racesComponent.nativeElement.querySelectorAll('a')[0].click();

    tick();
    appComponentFixture.detectChanges();

    const location = TestBed.inject(Location);

    expect(location.path()).withContext('You must navigate to /races/pending when clicking on the first tab').toBe('/races/pending');
  }));
});
