import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

import { RaceModel } from './models/race.model';
import { RaceService } from './race.service';

@Injectable({
  providedIn: 'root'
})
export class RaceResolver implements Resolve<RaceModel> {
  constructor(private raceService: RaceService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<RaceModel> {
    const raceId = +route.paramMap.get('raceId')!;
    return this.raceService.get(raceId);
  }
}
