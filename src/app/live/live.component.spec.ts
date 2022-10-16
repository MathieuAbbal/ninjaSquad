import { discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { By } from '@angular/platform-browser';
import { NgbAlert, NgbAlertConfig, NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { Subject, of, EMPTY } from 'rxjs';

import { RacesModule } from '../races/races.module';
import { LiveComponent } from './live.component';
import { RaceService } from '../race.service';
import { PonyWithPositionModel } from '../models/pony.model';
import { RaceModel } from '../models/race.model';
import { PonyComponent } from '../pony/pony.component';

describe('LiveComponent', () => {
  let raceService: jasmine.SpyObj<RaceService>;
  const race = {
    id: 1,
    name: 'Lyon',
    status: 'PENDING',
    ponies: [],
    startInstant: '2020-02-18T08:02:00Z'
  } as RaceModel;

  beforeEach(() => {
    raceService = jasmine.createSpyObj<RaceService>('RaceService', ['live', 'boost']);
    const activatedRoute = { snapshot: { data: { race: { ...race } } } };
    TestBed.configureTestingModule({
      imports: [RacesModule, RouterTestingModule, NgbAlertModule],
      providers: [
        { provide: RaceService, useValue: raceService },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    });
    // turn off the animation for the alert
    const alertConfig = TestBed.inject(NgbAlertConfig);
    alertConfig.animation = false;
  });

  it('should initialize the array of positions with an empty array', () => {
    raceService.live.and.returnValue(of([]));

    const fixture = TestBed.createComponent(LiveComponent);
    expect(fixture.componentInstance.poniesWithPosition)
      .withContext('poniesWithPosition should be initialized with an empty array')
      .not.toBeUndefined();
    expect(fixture.componentInstance.poniesWithPosition).toEqual([]);
  });

  it('should subscribe to the live observable if the race is PENDING', () => {
    const positions = new Subject<Array<PonyWithPositionModel>>();
    raceService.live.and.returnValue(positions);

    const fixture = TestBed.createComponent(LiveComponent);
    fixture.componentInstance.ngOnInit();

    expect(fixture.componentInstance.raceModel).toEqual(race);
    expect(raceService.live).toHaveBeenCalledWith(1);
    expect(fixture.componentInstance.positionSubscription).withContext('positionSubscription should store the subscription').not.toBeNull();
  });

  it('should subscribe to the live observable if the race is RUNNING', () => {
    const activatedRoute = TestBed.inject(ActivatedRoute);
    activatedRoute.snapshot.data['race'] = { ...race, status: 'RUNNING' };
    const positions = new Subject<Array<PonyWithPositionModel>>();
    raceService.live.and.returnValue(positions);

    const fixture = TestBed.createComponent(LiveComponent);
    fixture.componentInstance.ngOnInit();
    positions.next([{ id: 1, name: 'Sunny Sunday', color: 'BLUE', position: 0 }]);

    expect(fixture.componentInstance.raceModel).toEqual({ ...race, status: 'RUNNING' });
    expect(raceService.live).toHaveBeenCalledWith(1);
    expect(fixture.componentInstance.positionSubscription).withContext('positionSubscription should store the subscription').not.toBeNull();
    expect(fixture.componentInstance.poniesWithPosition.length).withContext('poniesWithPositions should store the positions').toBe(1);
  });

  it('should not subscribe to the live observable if the race is FINISHED', () => {
    const activatedRoute = TestBed.inject(ActivatedRoute);
    activatedRoute.snapshot.data['race'] = { ...race, status: 'FINISHED' };
    raceService.live.and.returnValue(EMPTY);

    const fixture = TestBed.createComponent(LiveComponent);
    fixture.componentInstance.ngOnInit();

    expect(fixture.componentInstance.raceModel).toEqual({ ...race, status: 'FINISHED' });
    expect(raceService.live).not.toHaveBeenCalledWith(1);
    expect(fixture.componentInstance.positionSubscription).withContext('positionSubscription should be null').toBeNull();
  });

  it('should change the race status once the race is RUNNING', () => {
    const positions = new Subject<Array<PonyWithPositionModel>>();
    raceService.live.and.returnValue(positions);

    const fixture = TestBed.createComponent(LiveComponent);
    fixture.componentInstance.ngOnInit();
    positions.next([{ id: 1, name: 'Sunny Sunday', color: 'BLUE', position: 0 }]);

    expect(fixture.componentInstance.poniesWithPosition.length).withContext('poniesWithPositions should store the positions').toBe(1);
    expect(fixture.componentInstance.raceModel!.status)
      .withContext('The race status should change to RUNNING once we receive positions')
      .toBe('RUNNING');
  });

  it('should switch the error flag if an error occurs', () => {
    const positions = new Subject<Array<PonyWithPositionModel>>();
    raceService.live.and.returnValue(positions);

    const fixture = TestBed.createComponent(LiveComponent);
    fixture.componentInstance.ngOnInit();

    positions.error(new Error('Oops'));
    expect(fixture.componentInstance.error).withContext('You should store that an error occurred in the `error` field').toBeTruthy();
  });

  it('should unsubscribe on destruction', () => {
    const positions = new Subject<Array<PonyWithPositionModel>>();
    raceService.live.and.returnValue(positions);

    const fixture = TestBed.createComponent(LiveComponent);
    fixture.componentInstance.ngOnInit();

    spyOn(fixture.componentInstance.positionSubscription!, 'unsubscribe');

    fixture.componentInstance.ngOnDestroy();

    expect(fixture.componentInstance.positionSubscription?.unsubscribe).toHaveBeenCalled();
  });

  it('should tidy things up when the race is over', () => {
    const activatedRoute = TestBed.inject(ActivatedRoute);
    activatedRoute.snapshot.data['race'] = {
      ...race,
      betPonyId: 1
    };
    const positions = new Subject<Array<PonyWithPositionModel>>();
    raceService.live.and.returnValue(positions);

    const fixture = TestBed.createComponent(LiveComponent);
    fixture.componentInstance.ngOnInit();

    positions.next([
      { id: 1, name: 'Sunny Sunday', color: 'BLUE', position: 100 },
      { id: 2, name: 'Pinkie Pie', color: 'GREEN', position: 101 },
      { id: 3, name: 'Awesome Fridge', color: 'YELLOW', position: 97 }
    ]);
    expect(fixture.componentInstance.poniesWithPosition.length).withContext('poniesWithPositions should store the positions').toBe(3);
    expect(fixture.componentInstance.winners).withContext('The winners should be empty until the race is over').toEqual([]);
    expect(fixture.componentInstance.betWon).withContext('The bet status should be null until the race is over').toBeNull();

    positions.complete();
    expect(fixture.componentInstance.raceModel!.status)
      .withContext('The race status should change to FINISHED once the race is over')
      .toBe('FINISHED');
    expect(fixture.componentInstance.winners.length).withContext('The winners should contain all the ponies that won the race').toBe(2);
    expect(fixture.componentInstance.winners.map(pony => pony.id))
      .withContext('The winners should contain all the ponies that won the race')
      .toEqual([1, 2]);
    expect(fixture.componentInstance.betWon).withContext('The bet status should be true if the player won the bet').toBe(true);
  });

  it('should display the pending race', () => {
    const activatedRoute = TestBed.inject(ActivatedRoute);
    activatedRoute.snapshot.data['race'] = {
      ...race,
      ponies: [
        { id: 1, name: 'Sunny Sunday', color: 'BLUE' },
        { id: 2, name: 'Pinkie Pie', color: 'GREEN' },
        { id: 3, name: 'Awesome Fridge', color: 'YELLOW' }
      ]
    };
    const positions = new Subject<Array<PonyWithPositionModel>>();
    raceService.live.and.returnValue(positions);

    const fixture = TestBed.createComponent(LiveComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement;
    const title = element.querySelector('h1');
    expect(title).withContext('The template should display an h1 element with the race name inside').not.toBeNull();
    expect(title.textContent).withContext('The template should display an h1 element with the race name inside').toContain('Lyon');
    const liveRace = element.querySelector('#live-race');
    expect(liveRace.textContent).toContain('The race will start');

    const debugElement = fixture.debugElement;
    const ponyComponents = debugElement.queryAll(By.directive(PonyComponent));
    expect(ponyComponents).withContext('You should display a `PonyComponent` for each pony').not.toBeNull();
    expect(ponyComponents.length).withContext('You should display a `PonyComponent` for each pony').toBe(3);

    const sunnySunday = ponyComponents[0];
    expect(sunnySunday.componentInstance.isRunning).withContext('The ponies should not be running').toBeFalsy();
  });

  it('should display the running race', () => {
    const activatedRoute = TestBed.inject(ActivatedRoute);
    activatedRoute.snapshot.data['race'] = {
      ...race,
      status: 'RUNNING',
      ponies: [
        { id: 1, name: 'Sunny Sunday', color: 'BLUE' },
        { id: 2, name: 'Pinkie Pie', color: 'GREEN' },
        { id: 3, name: 'Awesome Fridge', color: 'YELLOW' }
      ]
    };
    const positions = new Subject<Array<PonyWithPositionModel>>();
    raceService.live.and.returnValue(positions);

    const fixture = TestBed.createComponent(LiveComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement;
    const title = element.querySelector('h1');
    expect(title).withContext('The template should display an h1 element with the race name inside').not.toBeNull();
    expect(title.textContent).withContext('The template should display an h1 element with the race name inside').toContain('Lyon');

    positions.next([
      { id: 1, name: 'Sunny Sunday', color: 'BLUE', position: 10 },
      { id: 2, name: 'Pinkie Pie', color: 'GREEN', position: 10 },
      { id: 3, name: 'Awesome Fridge', color: 'YELLOW', position: 9 }
    ]);
    fixture.detectChanges();

    const debugElement = fixture.debugElement;
    const ponyComponents = debugElement.queryAll(By.directive(PonyComponent));
    expect(ponyComponents).withContext('You should display a `PonyComponent` for each pony').not.toBeNull();
    expect(ponyComponents.length).withContext('You should display a `PonyComponent` for each pony').toBe(3);

    const sunnySunday = ponyComponents[0];
    expect(sunnySunday.componentInstance.isRunning).withContext('The ponies should be running').toBeTruthy();
  });

  it('should display the finished race', () => {
    const activatedRoute = TestBed.inject(ActivatedRoute);
    activatedRoute.snapshot.data['race'] = {
      ...race,
      ponies: [
        { id: 1, name: 'Sunny Sunday', color: 'BLUE' },
        { id: 2, name: 'Pinkie Pie', color: 'GREEN' },
        { id: 3, name: 'Awesome Fridge', color: 'YELLOW' }
      ],
      betPonyId: 1
    };
    const positions = new Subject<Array<PonyWithPositionModel>>();
    raceService.live.and.returnValue(positions);

    const fixture = TestBed.createComponent(LiveComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement;
    const title = element.querySelector('h1');
    expect(title).withContext('The template should display an h1 element with the race name inside').not.toBeNull();
    expect(title.textContent).withContext('The template should display an h1 element with the race name inside').toContain('Lyon');

    positions.next([
      { id: 1, name: 'Sunny Sunday', color: 'BLUE', position: 101 },
      { id: 2, name: 'Pinkie Pie', color: 'GREEN', position: 100 },
      { id: 3, name: 'Awesome Fridge', color: 'YELLOW', position: 9 }
    ]);
    positions.complete();
    fixture.detectChanges();

    // won the bet!
    const debugElement = fixture.debugElement;
    const ponyComponents = debugElement.queryAll(By.directive(PonyComponent));
    expect(ponyComponents).withContext('You should display a `PonyComponent` for each winner').not.toBeNull();
    expect(ponyComponents.length).withContext('You should display a `PonyComponent` for each pony').toBe(2);

    const sunnySunday = ponyComponents[0];
    expect(sunnySunday.componentInstance.isRunning).withContext('The ponies should be not running').toBeFalsy();

    const success = fixture.debugElement.query(By.directive(NgbAlert));
    expect(success).withContext('You should have a success NgbAlert to display the bet won').not.toBeNull();
    expect(success.nativeElement.textContent).toContain('You won your bet!');
    expect(success.componentInstance.type).withContext('The alert should be a success one').toBe('success');

    // lost the bet...
    fixture.componentInstance.betWon = false;
    fixture.detectChanges();
    const betFailed = fixture.debugElement.query(By.directive(NgbAlert));
    expect(betFailed).withContext('You should have a warning NgbAlert to display the bet failed').not.toBeNull();
    expect(betFailed.nativeElement.textContent).toContain('You lost your bet.');
    expect(betFailed.componentInstance.type).withContext('The alert should be a warning one').toBe('warning');

    // no winners (race was already over)
    fixture.componentInstance.winners = [];
    fixture.detectChanges();
    expect(element.textContent).toContain('The race is over.');

    // an error occurred
    fixture.componentInstance.error = true;
    fixture.detectChanges();
    const alert = debugElement.query(By.directive(NgbAlert));
    expect(alert).withContext('You should have an NgbAlert to display the error').not.toBeNull();
    expect(alert.nativeElement.textContent).toContain('A problem occurred during the live.');
    const alertComponent = alert.componentInstance as NgbAlert;
    expect(alertComponent.type).withContext('The alert should be a danger one').toBe('danger');

    // close the alert
    alertComponent.close().subscribe();
    fixture.detectChanges();
    expect(debugElement.query(By.directive(NgbAlert)))
      .withContext('The NgbAlert should not be closable')
      .not.toBeNull();
  });

  it('should listen to click events on ponies in the template', () => {
    const activatedRoute = TestBed.inject(ActivatedRoute);
    activatedRoute.snapshot.data['race'] = {
      ...race,
      status: 'RUNNING',
      ponies: [
        { id: 1, name: 'Sunny Sunday', color: 'BLUE' },
        { id: 2, name: 'Pinkie Pie', color: 'GREEN' },
        { id: 3, name: 'Awesome Fridge', color: 'YELLOW' }
      ],
      betPonyId: 1
    };
    const positions = new Subject<Array<PonyWithPositionModel>>();
    raceService.live.and.returnValue(positions);

    const fixture = TestBed.createComponent(LiveComponent);
    fixture.detectChanges();

    spyOn(fixture.componentInstance, 'onClick');

    // let's start the race
    const poniesWithPositions = [
      { id: 1, name: 'Sunny Sunday', color: 'BLUE', position: 10 },
      { id: 2, name: 'Pinkie Pie', color: 'GREEN', position: 12 },
      { id: 3, name: 'Awesome Fridge', color: 'YELLOW', position: 6 }
    ];
    positions.next(poniesWithPositions);
    fixture.detectChanges();

    // when clicking on the first pony
    const ponyComponent = fixture.debugElement.query(By.directive(PonyComponent));
    expect(ponyComponent).withContext('You should display a `PonyComponent` for each pony').not.toBeNull();
    ponyComponent.triggerEventHandler('ponyClicked', {});

    // then the click handler should have been called with the first pony
    expect(fixture.componentInstance.onClick).toHaveBeenCalledWith(poniesWithPositions[0]);
  });

  it('should emit an event with the pony when a pony is clicked', () => {
    const activatedRoute = TestBed.inject(ActivatedRoute);
    activatedRoute.snapshot.data['race'] = { ...race };
    raceService.live.and.returnValue(EMPTY);
    const fixture = TestBed.createComponent(LiveComponent);
    fixture.componentInstance.ngOnInit();

    spyOn(fixture.componentInstance.clickSubject, 'next');

    const pony = { id: 1, name: 'Sunny Sunday', color: 'BLUE', position: 10 };

    // when a click is received
    fixture.componentInstance.onClick(pony);

    // then we should emit the pony on the subject
    expect(fixture.componentInstance.clickSubject.next).toHaveBeenCalledWith(pony);
  });

  it('should buffer clicks over a second and call the boost method', fakeAsync(() => {
    const activatedRoute = TestBed.inject(ActivatedRoute);
    activatedRoute.snapshot.data['race'] = { ...race, status: 'RUNNING' };
    raceService.boost.and.returnValue(of(undefined));
    raceService.live.and.returnValue(EMPTY);

    const fixture = TestBed.createComponent(LiveComponent);
    fixture.componentInstance.ngOnInit();
    tick();

    const pony = { id: 1, name: 'Sunny Sunday', color: 'BLUE', position: 10 };

    // when 5 clicks are emitted in a second
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony);
    tick(1000);

    // then we should call the boost method
    expect(raceService.boost).toHaveBeenCalledWith(race.id, pony.id);
    raceService.boost.calls.reset();

    // when 5 clicks are emitted over 2 seconds
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony);
    tick(1000);
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony);
    tick(1000);

    // then we should not call the boost method
    expect(raceService.boost).not.toHaveBeenCalled();
  }));

  it('should filter click buffer that are not at least 5', fakeAsync(() => {
    const activatedRoute = TestBed.inject(ActivatedRoute);
    activatedRoute.snapshot.data['race'] = { ...race, status: 'RUNNING' };
    raceService.boost.and.returnValue(of(undefined));
    raceService.live.and.returnValue(EMPTY);

    const fixture = TestBed.createComponent(LiveComponent);
    fixture.componentInstance.ngOnInit();
    tick();

    const pony = { id: 1, name: 'Sunny Sunday', color: 'BLUE', position: 10 };
    const pony2 = { id: 2, name: 'Black Friday', color: 'GREEN', position: 11 };

    // when 4 clicks are emitted in a second
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony);
    tick(1000);

    // then we should not call the boost method
    expect(raceService.boost).not.toHaveBeenCalled();

    // when 5 clicks are emitted over a second on two ponies
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony2);
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony2);
    fixture.componentInstance.clickSubject.next(pony);
    tick(1000);

    // then we should not call the boost method
    expect(raceService.boost).not.toHaveBeenCalled();
  }));

  it('should throttle repeated boosts', fakeAsync(() => {
    const activatedRoute = TestBed.inject(ActivatedRoute);
    activatedRoute.snapshot.data['race'] = { ...race, status: 'RUNNING' };
    raceService.boost.and.returnValue(of(undefined));
    raceService.live.and.returnValue(EMPTY);

    const fixture = TestBed.createComponent(LiveComponent);
    fixture.componentInstance.ngOnInit();
    tick();

    const pony = { id: 1, name: 'Sunny Sunday', color: 'BLUE', position: 10 };

    // when 5 clicks are emitted in a second
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony);
    tick(800);
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony);
    tick(200);

    // then we should call the boost method
    expect(raceService.boost).toHaveBeenCalled();
    raceService.boost.calls.reset();

    // when 2 other clicks are emitted
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony);
    tick(800);

    // then we should not call the boost method with the throttling
    expect(raceService.boost).not.toHaveBeenCalled();

    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony);
    tick(200);

    // we should call it a bit later
    expect(raceService.boost).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('should catch a boost error', fakeAsync(() => {
    const activatedRoute = TestBed.inject(ActivatedRoute);
    activatedRoute.snapshot.data['race'] = { ...race, status: 'RUNNING' };
    const boost = new Subject<void>();
    raceService.boost.and.returnValue(boost);
    raceService.live.and.returnValue(EMPTY);

    const fixture = TestBed.createComponent(LiveComponent);
    fixture.componentInstance.ngOnInit();
    tick();

    const pony = { id: 1, name: 'Sunny Sunday', color: 'BLUE', position: 10 };

    // when 5 clicks are emitted in a second
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony);
    tick(1000);

    // then we should call the boost method
    expect(raceService.boost).toHaveBeenCalled();
    raceService.boost.calls.reset();
    boost.error('You should catch a potential error from the boost method with a `catch` operator');

    // when 5 other clicks are emitted
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony);
    fixture.componentInstance.clickSubject.next(pony);
    tick(1000);

    // we should call it again if the previous error has been handled
    expect(raceService.boost).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('should use a trackBy method', () => {
    const activatedRoute = TestBed.inject(ActivatedRoute);
    activatedRoute.snapshot.data['race'] = { ...race, status: 'RUNNING' };
    const positions = new Subject<Array<PonyWithPositionModel>>();
    raceService.live.and.returnValue(positions);
    raceService.boost.and.returnValue(of(undefined));

    const fixture = TestBed.createComponent(LiveComponent);
    fixture.detectChanges();

    const poniesWithPositions = [
      { id: 1, name: 'Sunny Sunday', color: 'BLUE', position: 10 },
      { id: 2, name: 'Pinkie Pie', color: 'GREEN', position: 12 },
      { id: 3, name: 'Awesome Fridge', color: 'YELLOW', position: 6 }
    ];

    const trackByResult = fixture.componentInstance.ponyById(1, poniesWithPositions[0]);
    expect(trackByResult).withContext('The ponyById method should return the id of the pony').toBe(1);

    // we send some ponies
    positions.next(poniesWithPositions);
    fixture.detectChanges();

    const ponyComponent = fixture.nativeElement.querySelector('div.pony-wrapper');
    expect(ponyComponent).withContext('You should display a `PonyComponent` for each pony').not.toBeNull();

    // then the same ponies with other positions
    const otherPoniesWithPositions = [
      { id: 1, name: 'Sunny Sunday', color: 'BLUE', position: 14 },
      { id: 2, name: 'Pinkie Pie', color: 'GREEN', position: 18 },
      { id: 3, name: 'Awesome Fridge', color: 'YELLOW', position: 9 }
    ];

    positions.next(otherPoniesWithPositions);
    fixture.detectChanges();
    const otherPonyComponent = fixture.nativeElement.querySelector('div.pony-wrapper');
    expect(ponyComponent).withContext('You should use trackBy in your template').toBe(otherPonyComponent);
  });
});
