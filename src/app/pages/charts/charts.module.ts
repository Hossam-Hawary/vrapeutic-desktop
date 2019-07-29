import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { TranslateModule } from '@ngx-translate/core';
import { ChartsComponent } from './charts.component';
import { ChartsModule } from 'ng2-charts';
import { StatsComponent } from '../stats/stats.component';

const routes: Routes = [

  {
    path: '',
    component: ChartsComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    TranslateModule.forChild(),
    ChartsModule
  ],
  declarations: [ChartsComponent, StatsComponent],
})
export class ChartsComponentModule {}
