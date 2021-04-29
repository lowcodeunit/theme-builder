import { ThemeModel } from './../models/theme.model';
import { SubPaletteModel } from './../models/sub-palette.model';
import { Injectable } from '@angular/core';
import * as tinycolor from 'tinycolor2';
import { FontSelectionModel } from '../models/font-selection.model';

const tinyColor = tinycolor;
type RGBA = tinycolor.ColorFormats.RGBA;

@Injectable({
    providedIn: 'root'
  })

export class PaletteTemplateService {

  // public GenerateColorMap(theme: ThemeModel): string {
  // ${JSON.stringify(value, null, ' ').replace(/[{}"]/g, '')},
  //   let colorMap: string;
  //   colorMap = `
  //     $fathym-primary (
  //       ${JSON.stringify(theme.palette.PrimaryColorPalette, null, ' ').replace(/[{}"]/g, '')}
  //       $fathym-accent (
  //         ${JSON.stringify(theme.palette.AccentColorPalette, null, ' ').replace(/[{}"]/g, '')}
  //       )
  //     )
  //   `;
  //   return colorMap;
  // }

  /**
   * Generate a color map from the selecte theme
   *
   * @param theme current theme
   */
  public GenerateColorMap(theme: ThemeModel): string {
    let colorMap: string = '';

    for (const [key, value] of theme.palette.ColorMap) {
      const name: string = '$fathym-' + key;
      colorMap += `${name}: (
          ${JSON.stringify(theme.palette.PrimaryColorPalette, null, ' ').replace(/[{}"]/g, '')},
          contrast: (
            ${this.contrastColorMap(theme)}
          )
        );`;
    }
    return colorMap.replace(/\s+/g, '');
  }

  protected contrastColorMap(theme: ThemeModel): string {
    const darkPrimaryText: string = theme.palette.lightText || '#333';
    const lightPrimaryText: string = theme.palette.darkText || '#fff';

    const colorMap: string =
    `
      50: ${darkPrimaryText},
      100: ${darkPrimaryText},
      200: ${darkPrimaryText},
      300: ${lightPrimaryText},
      400: ${lightPrimaryText},
      500: ${lightPrimaryText},
      600: ${lightPrimaryText},
      700: ${lightPrimaryText},
      800: ${lightPrimaryText},
      900: ${lightPrimaryText},
      A100: ${darkPrimaryText},
      A200: ${lightPrimaryText},
      A400: ${lightPrimaryText},
      A700: ${lightPrimaryText}
    `;

    return colorMap;
  }

  /**
   * Return template for scss
   *
   * @param theme current theme
   */
    public GetTemplate(theme: ThemeModel): string {
      // debugger;
      
  // Fonts
//   ${Array.from(new Set((theme.fonts || []).map(x => x.family.replace(/ /g, '+'))))
//   .map(x => `@import url('https://fonts.googleapis.com/css?family=${x}:300,400,500');`).join('\n')}

// $fontConfig: (
// ${(theme.fonts || []).map(x => `${x.target}: ${this.fontRule(x)}`).join(',\n  ')}
// );


      const tpl = `/**
      * Generated theme by Material Theme Generator
      * https://materialtheme.arcsine.dev
      */

      @import '~@angular/material/theming';
      // Include the common styles for Angular Material. We include this here so that you only
      // have to load a single css file for Angular Material in your app.

    $global-theme-test: ${theme};

    

      // Fonts	
      @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500');	
          	
      $fontConfig: (	
        display-4: mat-typography-level(112px, 112px, 300, 'Roboto', -0.0134em),	
        display-3: mat-typography-level(56px, 56px, 400, 'Roboto', -0.0089em),	
        display-2: mat-typography-level(45px, 48px, 400, 'Roboto', 0.0000em),	
        display-1: mat-typography-level(34px, 40px, 400, 'Roboto', 0.0074em),	
        headline: mat-typography-level(24px, 32px, 400, 'Roboto', 0.0000em),	
        title: mat-typography-level(20px, 32px, 500, 'Roboto', 0.0075em),	
        subheading-2: mat-typography-level(16px, 28px, 400, 'Roboto', 0.0094em),	
        subheading-1: mat-typography-level(15px, 24px, 500, 'Roboto', 0.0067em),	
        body-2: mat-typography-level(14px, 24px, 500, 'Roboto', 0.0179em),	
        body-1: mat-typography-level(14px, 20px, 400, 'Roboto', 0.0179em),	
        button: mat-typography-level(14px, 14px, 500, 'Roboto', 0.0893em),	
        caption: mat-typography-level(12px, 20px, 400, 'Roboto', 0.0333em),	
        input: mat-typography-level(inherit, 1.125, 400, 'Roboto', 1.5px)	
            );

      // Foreground Elements

      // Light Theme Text
      $dark-text: ${theme.palette.lightText || '#fff'};
      $dark-primary-text: rgba($dark-text, 0.87);
      $dark-accent-text: rgba($dark-primary-text, 0.54);
      $dark-disabled-text: rgba($dark-primary-text, 0.38);
      $dark-dividers: rgba($dark-primary-text, 0.12);
      $dark-focused: rgba($dark-primary-text, 0.12);

      $mat-light-theme-foreground: (
        base:              black,
        divider:           $dark-dividers,
        dividers:          $dark-dividers,
        disabled:          $dark-disabled-text,
        disabled-button:   rgba($dark-text, 0.26),
        disabled-text:     $dark-disabled-text,
        elevation:         black,
        secondary-text:    $dark-accent-text,
        hint-text:         $dark-disabled-text,
        accent-text:       $dark-accent-text,
        icon:              $dark-accent-text,
        icons:             $dark-accent-text,
        text:              $dark-primary-text,
        slider-min:        $dark-primary-text,
        slider-off:        rgba($dark-text, 0.26),
        slider-off-active: $dark-disabled-text,
      );

      // Dark Theme text
      $light-text: ${theme.palette.darkText || '#000'};
      $light-primary-text: $light-text;
      $light-accent-text: rgba($light-primary-text, 0.7);
      $light-disabled-text: rgba($light-primary-text, 0.5);
      $light-dividers: rgba($light-primary-text, 0.12);
      $light-focused: rgba($light-primary-text, 0.12);

      $mat-dark-theme-foreground: (
        base:              $light-text,
        divider:           $light-dividers,
        dividers:          $light-dividers,
        disabled:          $light-disabled-text,
        disabled-button:   rgba($light-text, 0.3),
        disabled-text:     $light-disabled-text,
        elevation:         black,
        hint-text:         $light-disabled-text,
        secondary-text:    $light-accent-text,
        accent-text:       $light-accent-text,
        icon:              $light-text,
        icons:             $light-text,
        text:              $light-text,
        slider-min:        $light-text,
        slider-off:        rgba($light-text, 0.3),
        slider-off-active: rgba($light-text, 0.3),
      );

      // Background config
      // Light bg
      $light-background:    ${theme.palette.lightBackground || '#000'};
      $light-bg-darker-5:   darken($light-background, 5%);
      $light-bg-darker-10:  darken($light-background, 10%);
      $light-bg-darker-20:  darken($light-background, 20%);
      $light-bg-darker-30:  darken($light-background, 30%);
      $light-bg-lighter-5:  lighten($light-background, 5%);
      $dark-bg-alpha-4:     rgba(${theme.palette.darkBackground || '#2c2c2c'}, 0.04);
      $dark-bg-alpha-12:    rgba(${theme.palette.darkBackground || '#2c2c2c'}, 0.12);

      $mat-light-theme-background: (
        background:               $light-background,
        status-bar:               $light-bg-darker-20,
        app-bar:                  $light-bg-darker-5,
        hover:                    $dark-bg-alpha-4,
        card:                     $light-bg-lighter-5,
        dialog:                   $light-bg-lighter-5,
        disabled-button:          $dark-bg-alpha-12,
        raised-button:            $light-bg-lighter-5,
        focused-button:           $dark-focused,
        selected-button:          $light-bg-darker-20,
        selected-disabled-button: $light-bg-darker-30,
        disabled-button-toggle:   $light-bg-darker-10,
        unselected-chip:          $light-bg-darker-10,
        disabled-list-option:     $light-bg-darker-10,
      );

      // Dark bg
      $dark-background:     ${theme.palette.darkBackground || '#2c2c2c'};
      $dark-bg-lighter-5:   lighten($dark-background, 5%);
      $dark-bg-lighter-10:  lighten($dark-background, 10%);
      $dark-bg-lighter-20:  lighten($dark-background, 20%);
      $dark-bg-lighter-30:  lighten($dark-background, 30%);
      $light-bg-alpha-4:    rgba(${theme.palette.lightBackground || '#000'}, 0.04);
      $light-bg-alpha-12:   rgba(${theme.palette.lightBackground || '#000'}, 0.12);

      // Background palette for dark themes.
      $mat-dark-theme-background: (
        background:               $dark-background,
        status-bar:               $dark-bg-lighter-20,
        app-bar:                  $dark-bg-lighter-5,
        hover:                    $light-bg-alpha-4,
        card:                     $dark-bg-lighter-5,
        dialog:                   $dark-bg-lighter-5,
        disabled-button:          $light-bg-alpha-12,
        raised-button:            $dark-bg-lighter-5,
        focused-button:           $light-focused,
        selected-button:          $dark-bg-lighter-20,
        selected-disabled-button: $dark-bg-lighter-30,
        disabled-button-toggle:   $dark-bg-lighter-10,
        unselected-chip:          $dark-bg-lighter-20,
        disabled-list-option:     $dark-bg-lighter-10,
      );

      // Compute font config
      @include mat-core($fontConfig);

      // Theme Config
      ${['primary', 'accent', 'warn'].map(x => this.getScssPalette(x, theme.palette[x])).join('\n')};

      $theme: ${!theme.lightness ? 'mat-dark-theme' : 'mat-light-theme'}($theme-primary, $theme-accent, $theme-warn);
      $altTheme: ${!theme.lightness ? 'mat-light-theme' : 'mat-dark-theme'}($theme-primary, $theme-accent, $theme-warn);

      // Theme Init
      @include angular-material-theme($theme);

      .theme-alternate {
        @include angular-material-theme($altTheme);
      }


      // Specific component overrides, pieces that are not in line with the general theming

      // Handle buttons appropriately, with respect to line-height
      .mat-raised-button, .mat-stroked-button, .mat-flat-button {
        padding: 0 1.15em;
        margin: 0 .65em;
        min-width: 3em;
        
      }

      .mat-standard-chip {
        padding: .5em .85em;
        min-height: 2.5em;
      }
      `;
    // tslint:enable:no-trailing-whitespace
    // tslint:enable:max-line-length
    return tpl;
    }

    /**
     * Get the Scss Palatte
     *
     * @param name palette name
     *
     * @param subPalette SubPaletteModel
     */
    protected getScssPalette(name: string, subPalette: SubPaletteModel): string {
      return `
      body {
        --${name}-color: ${subPalette.main};
        --${name}-lighter-color: ${subPalette.lighter};
        --${name}-darker-color: ${subPalette.darker};
        --text-${name}-color: #{${this.getTextColor(subPalette.main)}};
        --text-${name}-lighter-color: #{${this.getTextColor(subPalette.lighter)}};
        --text-${name}-darker-color: #{${this.getTextColor(subPalette.darker)}};
      }

    $mat-${name}: (
      main: ${subPalette.main},
      lighter: ${subPalette.lighter},
      darker: ${subPalette.darker},
      200: ${subPalette.main}, // For slide toggle,
      contrast : (
        main: ${this.getTextColor(subPalette.main)},
        lighter: ${this.getTextColor(subPalette.lighter)},
        darker: ${this.getTextColor(subPalette.darker)},
      )
    );
    $theme-${name}: mat-palette($mat-${name}, main, lighter, darker);`;
  }

    /**
     * Get text color
     *
     * @param col color
     */
    protected getTextColor(col: string): string {
      return `$${tinyColor(col).isLight() ? 'dark' : 'light'}-primary-text`;
    }

    protected fontRule(x: FontSelectionModel): string {
        const weight = x.variant === 'light' ? '300' : (x.variant === 'medium' ? '500' : '400');

        return !!x.size ?
          `mat-typography-level(${x.size}px, ${x.lineHeight}px, ${weight}, '${x.family}', ${(x.spacing / x.size).toFixed(4)}em)` :
          `mat-typography-level(inherit, ${x.lineHeight}, ${weight}, '${x.family}', 1.5px)`;
      }
}
