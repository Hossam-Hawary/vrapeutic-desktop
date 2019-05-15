import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  { path: 'login', loadChildren: './pages/login/login.module#LoginPageModule' },
  { path: 'home', loadChildren: './pages/home/home.module#HomePageModule' },
  { path: 'patient/:id', loadChildren: './pages/patient/patient.module#PatientPageModule' },
  { path: 'patient/:patient_id/modules/:module_id/charts', loadChildren: './pages/charts/charts.module#ChartsComponentModule' },
  { path: '', redirectTo: '/login', pathMatch: 'full'}
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
