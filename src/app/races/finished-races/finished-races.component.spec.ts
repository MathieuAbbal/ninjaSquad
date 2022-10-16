import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { By } from '@angular/platform-browser';
import { NgbPagination, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

import { FinishedRacesComponent } from './finished-races.component';
import { RacesModule } from '../races.module';
import { RaceComponent } from '../../race/race.component';

describe('FinishedRacesComponent', () => {
  const activatedRoute = {
    snapshot: {
      data: {
        races: [
          { name: 'Lyon' },
          { name: 'Los Angeles' },
          { name: 'Sydney' },
          { name: 'Tokyo' },
          { name: 'Casablanca' },
          { name: 'Paris' },
          { name: 'London' },
          { name: 'Madrid' },
          { name: 'Lima' },
          { name: 'Bali' },
          { name: 'Berlin' },
          { name: 'Moscow' }
        ]
      }
    }
  };

  beforeEach(() => {
    TestBed.overrideTemplate(RaceComponent, '<h2>Race</h2>');
    TestBed.configureTestingModule({
      imports: [RacesModule, NgbPaginationModule],
      providers: [{ provide: ActivatedRoute, useValue: activatedRoute }]
    });
  });

  it('should display every race', () => {
    const fixture = TestBed.createComponent(FinishedRacesComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.races).withContext('You need to have a field `races` initialized with all races').not.toBeNull();
    expect(fixture.componentInstance.races.length).withContext('You need to have a field `races` initialized with all races').toBe(12);
    expect(fixture.componentInstance.page).withContext('You need to have a field `page` initialized with 1').toBe(1);

    const debugElement = fixture.debugElement;
    const raceNames = debugElement.queryAll(By.directive(RaceComponent));
    expect(raceNames.length).withContext('You should have 10 `RaceComponent` displayed').toBe(10);
    expect(raceNames[0].componentInstance.raceModel.name).withContext('You should display the first page races').toBe('Lyon');

    const pagination = debugElement.query(By.directive(NgbPagination));
    expect(pagination).withContext('You should have a pagination').not.toBeNull();
    const element = fixture.nativeElement;
    const pageLinks = element.querySelectorAll('a.page-link');
    expect(pageLinks.length).withContext('You should have 2 pages, as the test uses 12 races').toBe(4);

    fixture.componentInstance.page = 2;
    fixture.detectChanges();

    const raceNamesPage2 = debugElement.queryAll(By.directive(RaceComponent));
    expect(raceNamesPage2.length)
      .withContext('You should have 2 `RaceComponent` displayed on the 2nd page, as the test uses 12 races')
      .toBe(2);
    expect(raceNamesPage2[0].componentInstance.raceModel.name).withContext('You should display the second page races').toBe('Berlin');
  });

  it('should not display a link to bet on a race', () => {
    const fixture = TestBed.createComponent(FinishedRacesComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement;
    const raceNames = element.querySelectorAll('a:not(.page-link)');
    expect(raceNames.length).withContext('You must NOT have a link to go to the bet page for each race').toBe(0);
  });
});
