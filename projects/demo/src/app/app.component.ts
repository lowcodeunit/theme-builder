import { Constants } from './../../../common/src/lib/utils/constants.utils';
import { Component, OnInit } from '@angular/core';
import { ThemeBuilderService, PaletteModel, ThemeModel, PalettePickerService } from '@lowcodeunit/theme-builder-common';



// const styleVariables = require('../assets/styles/variables.scss');

@Component({
  selector: 'lcu-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  public Title: string;

  constructor(protected themeBuilderService: ThemeBuilderService,
    protected palettePickerService: PalettePickerService) {

    this.Title = 'Theme Builder';
  }

  public ngOnInit(): void {

    this.initialTheme();
  }

  /**
   * Setup the initial theme based on initial values
   * 
   * This will also setup the initial CSS variables
   */
  protected initialTheme(): void {
    let palette: PaletteModel = new PaletteModel();
    palette = { ...Constants.InitialValues, ...palette };

    this.themeBuilderService.Palette = palette;

  }

  /**
   * Change palette
   * 
   * @param type primary color
   */
  public ChangeThemeColors(type: string): void {

    let palette: PaletteModel = new PaletteModel();
      palette = { ...this.palettePickerService.CurrentPalette, ...palette };

    if (type === 'yellow') {
      palette.primary.main = '#ffcc11';
      palette.accent.main = '#990066';
      palette.warn.main = '#990000';

    } else {
      palette.primary.main = '#a83271';
      palette.accent.main = '#3298a8';
      palette.warn.main = '#b9f013';
    }

    // this.palettePickerService.PalettePickerChange(palette);

    this.themeBuilderService.Palette = palette;
  }
}
