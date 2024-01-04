import { Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Register } from 'src/app/interface/register.interface';
import { NotificationService } from 'src/app/service/notification.service';
import { UserService } from 'src/app/service/user.service';

@Component({
  selector: 'app-restaurar-pass',
  templateUrl: './restaurar-pass.component.html',
  styleUrls: ['./restaurar-pass.component.css']
})
export class RestaurarPassComponent {
  registroForm: FormGroup;
  constructor(private userService: UserService, private router: Router, private notification: NotificationService){
    this.registroForm = new FormGroup({
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
      confirmPassword: new FormControl('', [Validators.required])
    }, { validators: this.passwordMatchValidator });  
  }

  onSubmit() {
    if (this.registroForm.valid) {
      this.userService.cambiarPassword(this.registroForm.get('password')?.value).subscribe(
        async (res) => {
          try{
            console.log(res)
            const isConfirmed = await this.notification.showNotification(
              "success",
              "Restauración de Contraseña",
              "Revisa tu bandeja de entrada, si el email existe recibirás un correo con instrucciones para restaurar tu constraseña."
            );
      
            if (isConfirmed) {
              this.router.navigate(['/']);
            }
          
          } catch (error) {
    
          }
        },
        () => this.notification.showNotification(
          'error',
          'Error al registrar el usuario',
          'Hubo un error al registrar el usuario. Por favor, inténtalo más tarde.'
        )
      );
    } else {
      this.notification.showNotification(
        'error',
        'Error en el formulario',
        'Hubo al enviar el formulario. Por favor, revisa los campos.'
      )
    }
  }

  private passwordMatchValidator (control: AbstractControl): ValidationErrors | null {
    const pass = control.get('password')?.value;
    const confirmPass = control.get('confirmPassword')?.value;

    const isMismatch = pass !== confirmPass;
    console.log('Contraseña:', pass);
    console.log('Confirmar contraseña:', confirmPass);
    console.log('Contraseña coincide:', !isMismatch);

    return pass === confirmPass ? null : { passwordMismatch: true };
  };
}
