import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageLightboxComponent } from './image-lightbox.component';

@NgModule({
  declarations: [ImageLightboxComponent],
  imports: [CommonModule],
  exports:[ImageLightboxComponent]

})
export class ImageLightboxModule {}
