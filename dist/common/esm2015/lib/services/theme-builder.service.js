import { __awaiter } from "tslib";
import { VariantColorService } from './variant-color.service';
import { PalettePickerService } from './palette-picker.service';
import { LocalStorageService } from './local-storage.service';
import { ThemeBuilderConstants } from '../utils/theme-builder-constants.utils';
import { Injectable, NgZone } from '@angular/core';
import * as tinycolor from 'tinycolor2';
import { PaletteModel } from '../models/palette.model';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { PaletteTemplateService } from './palette-template.service';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common/http";
import * as i2 from "./palette-template.service";
import * as i3 from "./local-storage.service";
import * as i4 from "./palette-picker.service";
import * as i5 from "./variant-color.service";
const tinyColor = tinycolor;
export class ThemeBuilderService {
    constructor(http, paletteTemplateService, localStorageService, palettePickerService, zone, variantColorService) {
        this.http = http;
        this.paletteTemplateService = paletteTemplateService;
        this.localStorageService = localStorageService;
        this.palettePickerService = palettePickerService;
        this.zone = zone;
        this.variantColorService = variantColorService;
        this.themeMode = true;
        this.Theme = new Subject();
        this.PaletteColors = new Subject();
        this.ThemeScss = this.loadThemingScss();
        this.PaletteList = [];
    }
    /**
     * Set Palette colors
     */
    set Palette(palette) {
        this.palette = palette;
        this.palettePickerService.PalettePickerChange(palette);
        this.UpdateTheme(this.getTheme());
    }
    get Palette() {
        return this.palette;
    }
    set ThemeMode(light) {
        this.themeMode = !light;
        this.UpdateTheme(this.getTheme());
    }
    get ThemeMode() {
        return this.themeMode;
    }
    /**
     * load intial theme
     */
    loadThemingScss() {
        // this is generated in angular.json, pulls from node_modules/@angular/material
        // return this.http.get('/assets/_theming.scss', { responseType: 'text' })
        // Sass.writeFile('testfile.scss', '@import "./node_modules/@angular/material/theming";\n.testfile { content: "loaded"; }',(result: boolean) => {
        //   debugger;
        // })
        // Sass.compile('@import "testfile";', ((result: any) => {
        //   debugger;
        // }))
        return this.http.get('https://www.iot-ensemble.com/assets/theming/theming.scss', { responseType: 'text' })
            .pipe(map((x) => {
            return x
                .replace(/\n/gm, '??')
                .replace(/\$mat-([^:?]+)\s*:\s*\([? ]*50:[^()]*contrast\s*:\s*\([^)]+\)[ ?]*\);\s*?/g, (all, name) => name === 'grey' ? all : '')
                .replace(/\/\*.*?\*\//g, '')
                .split(/[?][?]/g)
                .map((l) => l
                .replace(/^\s*(\/\/.*)?$/g, '')
                .replace(/^\$mat-blue-gray\s*:\s*\$mat-blue-grey\s*;\s*/g, '')
                .replace(/^\s*|\s*$/g, '')
                .replace(/:\s\s+/g, ': '))
                .filter((l) => !!l)
                .join('\n');
        }), map((txt) => 
        // writeFile allows this file to be accessed from styles.scss
        Sass.writeFile('~@angular/material/theming', txt, (result) => {
            // console.log('Sass.writeFile', result);
        }))).toPromise();
    }
    /**
     * Get theme template and update it
     *
     * @param theme current theme
     */
    GetTemplate(theme) {
        return this.paletteTemplateService.GetTemplate(theme);
    }
    /**
     * Compile SASS to CSS
     *
     * @param theme SASS stylesheet
     * @returns compiled CSS
     */
    CompileScssTheme(theme) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ThemeScss;
            return new Promise((res, rej) => {
                Sass.compile(theme.replace('@include angular-material-theme($altTheme);', ''), (v) => {
                    if (v.status === 0) {
                        res(v.text);
                    }
                    else {
                        rej(v);
                    }
                });
            });
        });
    }
    /**
     * Return primary and accent colors for each color map, from colors 50 - A700
     *
     * @param color color
     */
    GetPalette(color) {
        const baseLight = tinyColor('#ffffff');
        const baseDark = this.multiply(tinyColor(color).toRgb(), tinyColor(color).toRgb());
        const [, , , baseTriad] = tinyColor(color).tetrad();
        const primary = Object.keys(ThemeBuilderConstants.MIX_AMOUNTS_PRIMARY)
            .map(k => {
            const [light, amount] = ThemeBuilderConstants.MIX_AMOUNTS_PRIMARY[k];
            return [k, tinyColor.mix(light ? baseLight : baseDark, tinyColor(color), amount)];
        });
        const accent = Object.keys(ThemeBuilderConstants.MIX_AMOUNTS_SECONDARY)
            .map(k => {
            const [amount, sat, light] = ThemeBuilderConstants.MIX_AMOUNTS_SECONDARY[k];
            return [k, tinyColor.mix(baseDark, baseTriad, amount)
                    .saturate(sat).lighten(light)];
        });
        return [...primary, ...accent].reduce((acc, [k, c]) => {
            acc[k] = c.toHexString();
            return acc;
        }, {});
    }
    /**
     * emit event with theme
     */
    emit() {
        this.Theme.next(this.getTheme());
    }
    /**
     * Return a new theme model
     */
    getTheme() {
        return {
            palette: this.Palette,
            lightness: this.ThemeMode,
        };
    }
    multiply(rgb1, rgb2) {
        rgb1.b = Math.floor(rgb1.b * rgb2.b / 255);
        rgb1.g = Math.floor(rgb1.g * rgb2.g / 255);
        rgb1.r = Math.floor(rgb1.r * rgb2.r / 255);
        return tinyColor('rgb ' + rgb1.r + ' ' + rgb1.g + ' ' + rgb1.b);
    }
    UpdateTheme(theme) {
        // SASS stylesheet
        const source = this.GetTemplate(theme);
        // Running functions outside of Angular's zone and do work that
        // doesn't trigger Angular change-detection.
        this.zone.runOutsideAngular(() => {
            this.CompileScssTheme(source).then((text) => {
                // SASS compiled to CSS
                const compiledDynamicCSS = text;
                const dynamicStyleSheet = document.getElementById('theme-builder-stylesheet');
                // check if dynamic stylesheet exists, then remove it
                if (dynamicStyleSheet) {
                    document.getElementsByTagName('body')[0].removeChild(dynamicStyleSheet);
                }
                // add dynamic stylesheet
                const style = document.createElement('style');
                style.id = 'theme-builder-stylesheet';
                style.appendChild(document.createTextNode(compiledDynamicCSS));
                document.getElementsByTagName('body')[0].appendChild(style);
            }).catch((err) => {
                console.error(err);
            });
        });
    }
    SetThemes(themes) {
        this.Themes = themes;
        let initial = new PaletteModel();
        initial = Object.assign(Object.assign({}, ThemeBuilderConstants.InitialValues), initial);
        initial.primary.main = this.Themes[0].Primary;
        initial.accent.main = this.Themes[0].Accent;
        initial.warn.main = this.Themes[0].Warn;
        this.Palette = initial;
        this.variantColorService.UpdatePrimaryVariants(this.Themes[0].Primary);
        this.variantColorService.UpdateAccentVariants(this.Themes[0].Accent);
        this.variantColorService.UpdateWarnVariants(this.Themes[0].Warn);
    }
}
ThemeBuilderService.ɵprov = i0.ɵɵdefineInjectable({ factory: function ThemeBuilderService_Factory() { return new ThemeBuilderService(i0.ɵɵinject(i1.HttpClient), i0.ɵɵinject(i2.PaletteTemplateService), i0.ɵɵinject(i3.LocalStorageService), i0.ɵɵinject(i4.PalettePickerService), i0.ɵɵinject(i0.NgZone), i0.ɵɵinject(i5.VariantColorService)); }, token: ThemeBuilderService, providedIn: "root" });
ThemeBuilderService.decorators = [
    { type: Injectable, args: [{
                providedIn: 'root'
            },] }
];
ThemeBuilderService.ctorParameters = () => [
    { type: HttpClient },
    { type: PaletteTemplateService },
    { type: LocalStorageService },
    { type: PalettePickerService },
    { type: NgZone },
    { type: VariantColorService }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWUtYnVpbGRlci5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY29tbW9uL3NyYy9saWIvc2VydmljZXMvdGhlbWUtYnVpbGRlci5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUM5RCxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUVoRSxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUM5RCxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSx3Q0FBd0MsQ0FBQztBQUUvRSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUNuRCxPQUFPLEtBQUssU0FBUyxNQUFNLFlBQVksQ0FBQztBQUN4QyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFDdkQsT0FBTyxFQUFpQixPQUFPLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFDOUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBRXJDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUVsRCxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQzs7Ozs7OztBQUdwRSxNQUFNLFNBQVMsR0FBRyxTQUFTLENBQUM7QUFZNUIsTUFBTSxPQUFPLG1CQUFtQjtJQXVCOUIsWUFDWSxJQUFnQixFQUNoQixzQkFBOEMsRUFDOUMsbUJBQXdDLEVBQ3hDLG9CQUEwQyxFQUMxQyxJQUFZLEVBQ1osbUJBQXdDO1FBTHhDLFNBQUksR0FBSixJQUFJLENBQVk7UUFDaEIsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF3QjtRQUM5Qyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1FBQ3hDLHlCQUFvQixH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RXhDLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBRXZCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3ZFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3JFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRW5FLENBQUM7Ozs7WUFsUEYsVUFBVSxTQUFDO2dCQUNWLFVBQVUsRUFBRSxNQUFNO2FBQ25COzs7WUFmUSxVQUFVO1lBRVYsc0JBQXNCO1lBWHRCLG1CQUFtQjtZQUZuQixvQkFBb0I7WUFLUixNQUFNO1lBTmxCLG1CQUFtQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFZhcmlhbnRDb2xvclNlcnZpY2UgfSBmcm9tICcuL3ZhcmlhbnQtY29sb3Iuc2VydmljZSc7XHJcbmltcG9ydCB7IFBhbGV0dGVQaWNrZXJTZXJ2aWNlIH0gZnJvbSAnLi9wYWxldHRlLXBpY2tlci5zZXJ2aWNlJztcclxuaW1wb3J0IHsgQ29sb3JNYXBNb2RlbCB9IGZyb20gJy4vLi4vbW9kZWxzL2NvbG9yLW1hcC5tb2RlbCc7XHJcbmltcG9ydCB7IExvY2FsU3RvcmFnZVNlcnZpY2UgfSBmcm9tICcuL2xvY2FsLXN0b3JhZ2Uuc2VydmljZSc7XHJcbmltcG9ydCB7IFRoZW1lQnVpbGRlckNvbnN0YW50cyB9IGZyb20gJy4uL3V0aWxzL3RoZW1lLWJ1aWxkZXItY29uc3RhbnRzLnV0aWxzJztcclxuaW1wb3J0IHsgTWF0ZXJpYWxQYWxldHRlTW9kZWwgfSBmcm9tICcuLy4uL21vZGVscy9tYXRlcmlhbC1wYWxldHRlLm1vZGVsJztcclxuaW1wb3J0IHsgSW5qZWN0YWJsZSwgTmdab25lIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCAqIGFzIHRpbnljb2xvciBmcm9tICd0aW55Y29sb3IyJztcclxuaW1wb3J0IHsgUGFsZXR0ZU1vZGVsIH0gZnJvbSAnLi4vbW9kZWxzL3BhbGV0dGUubW9kZWwnO1xyXG5pbXBvcnQgeyBSZXBsYXlTdWJqZWN0LCBTdWJqZWN0IH0gZnJvbSAncnhqcyc7XHJcbmltcG9ydCB7IG1hcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcclxuaW1wb3J0IHsgVGhlbWVNb2RlbCB9IGZyb20gJy4uL21vZGVscy90aGVtZS5tb2RlbCc7XHJcbmltcG9ydCB7IEh0dHBDbGllbnQgfSBmcm9tICdAYW5ndWxhci9jb21tb24vaHR0cCc7XHJcbmltcG9ydCB7IFBhbGV0dGVMaXN0TW9kZWwgfSBmcm9tICcuLi9tb2RlbHMvcGFsZXR0ZS1saXN0Lm1vZGVsJztcclxuaW1wb3J0IHsgUGFsZXR0ZVRlbXBsYXRlU2VydmljZSB9IGZyb20gJy4vcGFsZXR0ZS10ZW1wbGF0ZS5zZXJ2aWNlJztcclxuaW1wb3J0IHsgVGhlbWVQaWNrZXJNb2RlbCB9IGZyb20gJy4uL21vZGVscy90aGVtZS1waWNrZXIubW9kZWwnO1xyXG5cclxuY29uc3QgdGlueUNvbG9yID0gdGlueWNvbG9yO1xyXG5cclxudHlwZSBSR0JBID0gdGlueWNvbG9yLkNvbG9yRm9ybWF0cy5SR0JBO1xyXG5cclxuLy8gdGVsbCB0eXBlc2NyaXB0IHRoYXQgU2FzcyBleGlzdHNcclxuLy8gbG9hZHMgdGhlIHN5bmNocm9ub3VzIFNhc3MuanNcclxuZGVjbGFyZSB2YXIgU2FzczogYW55O1xyXG5cclxuQEluamVjdGFibGUoe1xyXG4gIHByb3ZpZGVkSW46ICdyb290J1xyXG59KVxyXG5cclxuZXhwb3J0IGNsYXNzIFRoZW1lQnVpbGRlclNlcnZpY2Uge1xyXG5cclxuICAvKipcclxuICAgKiBJcyBpdCBsaWdodG5lc3NcclxuICAgKi9cclxuICBwcm90ZWN0ZWQgdGhlbWVNb2RlOiBib29sZWFuO1xyXG5cclxuICAvKipcclxuICAgKiBUaGVtZSBQYWxldHRlXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIHBhbGV0dGU6IFBhbGV0dGVNb2RlbDtcclxuXHJcbiAgLy8gcHVibGljICRmb250cyA9IG5ldyBTdWJqZWN0PEZvbnRTZWxlY3Rpb25Nb2RlbFtdPigpO1xyXG4gIHB1YmxpYyBUaGVtZTogU3ViamVjdDxUaGVtZU1vZGVsPjtcclxuICBwdWJsaWMgUGFsZXR0ZUNvbG9yczogU3ViamVjdDxQYXJ0aWFsPFBhbGV0dGVNb2RlbD4+O1xyXG4gIHB1YmxpYyBUaGVtZVNjc3M6IFByb21pc2U8dm9pZD47XHJcbiAgcHVibGljIFBhbGV0dGVMaXN0OiBBcnJheTxQYWxldHRlTGlzdE1vZGVsPjtcclxuXHJcbiAgLyoqXHJcbiAgICogUGFsZXR0ZSBjb2xvcnMsIGZyb20gNTAgLSBBNzAwXHJcbiAgICovXHJcbiAgcHVibGljIE1hdGVyaWFsUGFsZXR0ZUNvbG9yczogTWF0ZXJpYWxQYWxldHRlTW9kZWw7XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcHJvdGVjdGVkIGh0dHA6IEh0dHBDbGllbnQsIFxyXG4gICAgcHJvdGVjdGVkIHBhbGV0dGVUZW1wbGF0ZVNlcnZpY2U6IFBhbGV0dGVUZW1wbGF0ZVNlcnZpY2UsXHJcbiAgICBwcm90ZWN0ZWQgbG9jYWxTdG9yYWdlU2VydmljZTogTG9jYWxTdG9yYWdlU2VydmljZSxcclxuICAgIHByb3RlY3RlZCBwYWxldHRlUGlja2VyU2VydmljZTogUGFsZXR0ZVBpY2tlclNlcnZpY2UsXHJcbiAgICBwcm90ZWN0ZWQgem9uZTogTmdab25lLFxyXG4gICAgcHJvdGVjdGVkIHZhcmlhbnRDb2xvclNlcnZpY2U6IFZhcmlhbnRDb2xvclNlcnZpY2UpIHtcclxuXHJcbiAgICB0aGlzLnRoZW1lTW9kZSA9IHRydWU7XHJcbiAgICB0aGlzLlRoZW1lID0gbmV3IFN1YmplY3Q8VGhlbWVNb2RlbD4oKTtcclxuICAgIHRoaXMuUGFsZXR0ZUNvbG9ycyA9IG5ldyBTdWJqZWN0PFBhcnRpYWw8UGFsZXR0ZU1vZGVsPj4oKTtcclxuICAgIHRoaXMuVGhlbWVTY3NzID0gdGhpcy5sb2FkVGhlbWluZ1Njc3MoKTtcclxuXHJcbiAgICB0aGlzLlBhbGV0dGVMaXN0ID0gW107XHJcbiAgIH1cclxuXHJcbiAgIC8qKlxyXG4gICAgKiBTZXQgUGFsZXR0ZSBjb2xvcnNcclxuICAgICovXHJcbiAgICBwdWJsaWMgc2V0IFBhbGV0dGUocGFsZXR0ZTogUGFsZXR0ZU1vZGVsKSB7XHJcblxyXG4gICAgICB0aGlzLnBhbGV0dGUgPSBwYWxldHRlO1xyXG4gICAgICB0aGlzLnBhbGV0dGVQaWNrZXJTZXJ2aWNlLlBhbGV0dGVQaWNrZXJDaGFuZ2UocGFsZXR0ZSk7XHJcblxyXG4gICAgICB0aGlzLlVwZGF0ZVRoZW1lKHRoaXMuZ2V0VGhlbWUoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBQYWxldHRlKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5wYWxldHRlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXQgVGhlbWVNb2RlKGxpZ2h0OiBib29sZWFuKSB7XHJcbiAgICAgIHRoaXMudGhlbWVNb2RlID0gIWxpZ2h0O1xyXG4gICAgICB0aGlzLlVwZGF0ZVRoZW1lKHRoaXMuZ2V0VGhlbWUoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBUaGVtZU1vZGUoKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnRoZW1lTW9kZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgVGhlbWVzOiBBcnJheTxUaGVtZVBpY2tlck1vZGVsPjtcclxuXHJcbiAgIC8qKlxyXG4gICAgKiBsb2FkIGludGlhbCB0aGVtZVxyXG4gICAgKi9cclxuICAgcHJvdGVjdGVkIGxvYWRUaGVtaW5nU2NzcygpOiBQcm9taXNlPHZvaWQ+IHtcclxuXHJcbiAgICAgLy8gdGhpcyBpcyBnZW5lcmF0ZWQgaW4gYW5ndWxhci5qc29uLCBwdWxscyBmcm9tIG5vZGVfbW9kdWxlcy9AYW5ndWxhci9tYXRlcmlhbFxyXG4gICAgLy8gcmV0dXJuIHRoaXMuaHR0cC5nZXQoJy9hc3NldHMvX3RoZW1pbmcuc2NzcycsIHsgcmVzcG9uc2VUeXBlOiAndGV4dCcgfSlcclxuICAgIC8vIFNhc3Mud3JpdGVGaWxlKCd0ZXN0ZmlsZS5zY3NzJywgJ0BpbXBvcnQgXCIuL25vZGVfbW9kdWxlcy9AYW5ndWxhci9tYXRlcmlhbC90aGVtaW5nXCI7XFxuLnRlc3RmaWxlIHsgY29udGVudDogXCJsb2FkZWRcIjsgfScsKHJlc3VsdDogYm9vbGVhbikgPT4ge1xyXG4gICAgLy8gICBkZWJ1Z2dlcjtcclxuICAgIC8vIH0pXHJcbiAgICAvLyBTYXNzLmNvbXBpbGUoJ0BpbXBvcnQgXCJ0ZXN0ZmlsZVwiOycsICgocmVzdWx0OiBhbnkpID0+IHtcclxuICAgIC8vICAgZGVidWdnZXI7XHJcbiAgICAvLyB9KSlcclxuICAgIHJldHVybiB0aGlzLmh0dHAuZ2V0KCdodHRwczovL3d3dy5pb3QtZW5zZW1ibGUuY29tL2Fzc2V0cy90aGVtaW5nL3RoZW1pbmcuc2NzcycsIHsgcmVzcG9uc2VUeXBlOiAndGV4dCcgfSlcclxuICAgICAgLnBpcGUoXHJcbiAgICAgICAgbWFwKCh4OiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgIHJldHVybiB4XHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXG4vZ20sICc/PycpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXCRtYXQtKFteOj9dKylcXHMqOlxccypcXChbPyBdKjUwOlteKCldKmNvbnRyYXN0XFxzKjpcXHMqXFwoW14pXStcXClbID9dKlxcKTtcXHMqPy9nLFxyXG4gICAgICAgICAgICAgIChhbGw6IHN0cmluZywgbmFtZTogc3RyaW5nKSA9PiBuYW1lID09PSAnZ3JleScgPyBhbGwgOiAnJylcclxuICAgICAgICAgICAgLnJlcGxhY2UoL1xcL1xcKi4qP1xcKlxcLy9nLCAnJylcclxuICAgICAgICAgICAgLnNwbGl0KC9bP11bP10vZylcclxuICAgICAgICAgICAgLm1hcCgobDogc3RyaW5nKSA9PiBsXHJcbiAgICAgICAgICAgICAgLnJlcGxhY2UoL15cXHMqKFxcL1xcLy4qKT8kL2csICcnKVxyXG4gICAgICAgICAgICAgIC5yZXBsYWNlKC9eXFwkbWF0LWJsdWUtZ3JheVxccyo6XFxzKlxcJG1hdC1ibHVlLWdyZXlcXHMqO1xccyovZywgJycpXHJcbiAgICAgICAgICAgICAgLnJlcGxhY2UoL15cXHMqfFxccyokL2csICcnKVxyXG4gICAgICAgICAgICAgIC5yZXBsYWNlKC86XFxzXFxzKy9nLCAnOiAnKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgIC5maWx0ZXIoKGw6IHN0cmluZykgPT4gISFsKVxyXG4gICAgICAgICAgICAuam9pbignXFxuJyk7XHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgbWFwKCh0eHQ6IHN0cmluZykgPT5cclxuICAgICAgICAgIC8vIHdyaXRlRmlsZSBhbGxvd3MgdGhpcyBmaWxlIHRvIGJlIGFjY2Vzc2VkIGZyb20gc3R5bGVzLnNjc3NcclxuICAgICAgICAgIFNhc3Mud3JpdGVGaWxlKCd+QGFuZ3VsYXIvbWF0ZXJpYWwvdGhlbWluZycsIHR4dCwgKHJlc3VsdDogYm9vbGVhbikgPT4ge1xyXG4gICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdTYXNzLndyaXRlRmlsZScsIHJlc3VsdCk7XHJcbiAgICAgICAgICB9KSlcclxuICAgICAgKS50b1Byb21pc2UoKTtcclxuICAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZXQgdGhlbWUgdGVtcGxhdGUgYW5kIHVwZGF0ZSBpdFxyXG4gICAqIFxyXG4gICAqIEBwYXJhbSB0aGVtZSBjdXJyZW50IHRoZW1lXHJcbiAgICovXHJcbiAgcHVibGljIEdldFRlbXBsYXRlKHRoZW1lOiBUaGVtZU1vZGVsKTogc3RyaW5nIHtcclxuICAgIHJldHVybiB0aGlzLnBhbGV0dGVUZW1wbGF0ZVNlcnZpY2UuR2V0VGVtcGxhdGUodGhlbWUpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29tcGlsZSBTQVNTIHRvIENTU1xyXG4gICAqXHJcbiAgICogQHBhcmFtIHRoZW1lIFNBU1Mgc3R5bGVzaGVldFxyXG4gICAqIEByZXR1cm5zIGNvbXBpbGVkIENTU1xyXG4gICAqL1xyXG4gICBwdWJsaWMgYXN5bmMgQ29tcGlsZVNjc3NUaGVtZSh0aGVtZTogc3RyaW5nKSB7XHJcbiAgICBhd2FpdCB0aGlzLlRoZW1lU2NzcztcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXMsIHJlaikgPT4ge1xyXG4gICAgICBTYXNzLmNvbXBpbGUodGhlbWUucmVwbGFjZSgnQGluY2x1ZGUgYW5ndWxhci1tYXRlcmlhbC10aGVtZSgkYWx0VGhlbWUpOycsICcnKSwgKHY6IGFueSkgPT4ge1xyXG4gICAgICAgIGlmICh2LnN0YXR1cyA9PT0gMCkge1xyXG4gICAgICAgICAgcmVzKHYudGV4dCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJlaih2KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgKTtcclxuICAgfVxyXG5cclxuICAgLyoqXHJcbiAgICAqIFJldHVybiBwcmltYXJ5IGFuZCBhY2NlbnQgY29sb3JzIGZvciBlYWNoIGNvbG9yIG1hcCwgZnJvbSBjb2xvcnMgNTAgLSBBNzAwXHJcbiAgICAqXHJcbiAgICAqIEBwYXJhbSBjb2xvciBjb2xvclxyXG4gICAgKi9cclxuICAgcHVibGljIEdldFBhbGV0dGUoY29sb3I6IHN0cmluZyk6IE1hdGVyaWFsUGFsZXR0ZU1vZGVsIHtcclxuICAgIGNvbnN0IGJhc2VMaWdodCA9IHRpbnlDb2xvcignI2ZmZmZmZicpO1xyXG4gICAgY29uc3QgYmFzZURhcmsgPSB0aGlzLm11bHRpcGx5KHRpbnlDb2xvcihjb2xvcikudG9SZ2IoKSwgdGlueUNvbG9yKGNvbG9yKS50b1JnYigpKTtcclxuICAgIGNvbnN0IFssICwgLCBiYXNlVHJpYWRdID0gdGlueUNvbG9yKGNvbG9yKS50ZXRyYWQoKTtcclxuXHJcbiAgICBjb25zdCBwcmltYXJ5ID0gT2JqZWN0LmtleXMoVGhlbWVCdWlsZGVyQ29uc3RhbnRzLk1JWF9BTU9VTlRTX1BSSU1BUlkpXHJcbiAgICAgIC5tYXAoayA9PiB7XHJcbiAgICAgICAgY29uc3QgW2xpZ2h0LCBhbW91bnRdID0gVGhlbWVCdWlsZGVyQ29uc3RhbnRzLk1JWF9BTU9VTlRTX1BSSU1BUllba107XHJcbiAgICAgICAgcmV0dXJuIFtrLCB0aW55Q29sb3IubWl4KGxpZ2h0ID8gYmFzZUxpZ2h0IDogYmFzZURhcmssXHJcbiAgICAgICAgICB0aW55Q29sb3IoY29sb3IpLCBhbW91bnQpXSBhcyBbc3RyaW5nLCB0aW55Y29sb3IuSW5zdGFuY2VdO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICBjb25zdCBhY2NlbnQgPSBPYmplY3Qua2V5cyhUaGVtZUJ1aWxkZXJDb25zdGFudHMuTUlYX0FNT1VOVFNfU0VDT05EQVJZKVxyXG4gICAgICAubWFwKGsgPT4ge1xyXG4gICAgICAgIGNvbnN0IFthbW91bnQsIHNhdCwgbGlnaHRdID0gVGhlbWVCdWlsZGVyQ29uc3RhbnRzLk1JWF9BTU9VTlRTX1NFQ09OREFSWVtrXTtcclxuICAgICAgICByZXR1cm4gW2ssIHRpbnlDb2xvci5taXgoYmFzZURhcmssIGJhc2VUcmlhZCwgYW1vdW50KVxyXG4gICAgICAgICAgLnNhdHVyYXRlKHNhdCkubGlnaHRlbihsaWdodCldIGFzIFtzdHJpbmcsIHRpbnljb2xvci5JbnN0YW5jZV07XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBbLi4ucHJpbWFyeSwgLi4uYWNjZW50XS5yZWR1Y2UoKGFjYywgW2ssIGNdKSA9PiB7XHJcbiAgICAgIGFjY1trXSA9IGMudG9IZXhTdHJpbmcoKTtcclxuICAgICAgcmV0dXJuIGFjYztcclxuICAgIH0sIHt9KTtcclxuICAgfVxyXG5cclxuICAgLyoqXHJcbiAgICAqIGVtaXQgZXZlbnQgd2l0aCB0aGVtZVxyXG4gICAgKi9cclxuICAgcHJvdGVjdGVkIGVtaXQoKTogdm9pZCB7XHJcbiAgICAgdGhpcy5UaGVtZS5uZXh0KHRoaXMuZ2V0VGhlbWUoKSk7XHJcbiAgIH1cclxuXHJcbiAgIC8qKlxyXG4gICAgKiBSZXR1cm4gYSBuZXcgdGhlbWUgbW9kZWxcclxuICAgICovXHJcbiAgIHB1YmxpYyBnZXRUaGVtZSgpOiBUaGVtZU1vZGVsIHtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBwYWxldHRlOiB0aGlzLlBhbGV0dGUsXHJcbiAgICAgIGxpZ2h0bmVzczogdGhpcy5UaGVtZU1vZGUsXHJcbiAgICB9O1xyXG4gICB9XHJcblxyXG4gICBwdWJsaWMgbXVsdGlwbHkocmdiMTogUkdCQSwgcmdiMjogUkdCQSk6IGFueSB7XHJcbiAgICByZ2IxLmIgPSBNYXRoLmZsb29yKHJnYjEuYiAqIHJnYjIuYiAvIDI1NSk7XHJcbiAgICByZ2IxLmcgPSBNYXRoLmZsb29yKHJnYjEuZyAqIHJnYjIuZyAvIDI1NSk7XHJcbiAgICByZ2IxLnIgPSBNYXRoLmZsb29yKHJnYjEuciAqIHJnYjIuciAvIDI1NSk7XHJcblxyXG4gICAgcmV0dXJuIHRpbnlDb2xvcigncmdiICcgKyByZ2IxLnIgKyAnICcgKyByZ2IxLmcgKyAnICcgKyByZ2IxLmIpO1xyXG4gICB9XHJcblxyXG4gICBwdWJsaWMgVXBkYXRlVGhlbWUodGhlbWU6IFRoZW1lTW9kZWwpOiB2b2lkIHtcclxuXHJcbiAgICAvLyBTQVNTIHN0eWxlc2hlZXRcclxuICAgIGNvbnN0IHNvdXJjZTogc3RyaW5nID0gdGhpcy5HZXRUZW1wbGF0ZSh0aGVtZSk7XHJcblxyXG4gICAgLy8gUnVubmluZyBmdW5jdGlvbnMgb3V0c2lkZSBvZiBBbmd1bGFyJ3Mgem9uZSBhbmQgZG8gd29yayB0aGF0XHJcbiAgICAvLyBkb2Vzbid0IHRyaWdnZXIgQW5ndWxhciBjaGFuZ2UtZGV0ZWN0aW9uLlxyXG4gICB0aGlzLnpvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xyXG5cclxuICAgICB0aGlzLkNvbXBpbGVTY3NzVGhlbWUoc291cmNlKS50aGVuKCAodGV4dDogc3RyaW5nKSA9PiB7XHJcblxyXG4gICAgICAgIC8vIFNBU1MgY29tcGlsZWQgdG8gQ1NTXHJcbiAgICAgICAgY29uc3QgY29tcGlsZWREeW5hbWljQ1NTOiBzdHJpbmcgPSB0ZXh0O1xyXG5cclxuICAgICAgICBjb25zdCBkeW5hbWljU3R5bGVTaGVldDogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGhlbWUtYnVpbGRlci1zdHlsZXNoZWV0Jyk7XHJcblxyXG4gICAgICAgIC8vIGNoZWNrIGlmIGR5bmFtaWMgc3R5bGVzaGVldCBleGlzdHMsIHRoZW4gcmVtb3ZlIGl0XHJcbiAgICAgICAgaWYgKGR5bmFtaWNTdHlsZVNoZWV0KSB7XHJcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdLnJlbW92ZUNoaWxkKGR5bmFtaWNTdHlsZVNoZWV0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGFkZCBkeW5hbWljIHN0eWxlc2hlZXRcclxuICAgICAgICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcbiAgICAgICAgICAgICAgc3R5bGUuaWQgPSAndGhlbWUtYnVpbGRlci1zdHlsZXNoZWV0JztcclxuICAgICAgICAgICAgICBzdHlsZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShjb21waWxlZER5bmFtaWNDU1MpKTtcclxuXHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVswXS5hcHBlbmRDaGlsZChzdHlsZSk7XHJcblxyXG4gICAgICB9KS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcclxuICAgICAgfSk7XHJcbiAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIFNldFRoZW1lcyh0aGVtZXM6IEFycmF5PFRoZW1lUGlja2VyTW9kZWw+KTogdm9pZCB7XHJcbiAgICB0aGlzLlRoZW1lcyA9IHRoZW1lcztcclxuXHJcbiAgICBsZXQgaW5pdGlhbDogUGFsZXR0ZU1vZGVsID0gbmV3IFBhbGV0dGVNb2RlbCgpO1xyXG4gICAgaW5pdGlhbCA9IHsgLi4uVGhlbWVCdWlsZGVyQ29uc3RhbnRzLkluaXRpYWxWYWx1ZXMsIC4uLmluaXRpYWwgfTtcclxuICAgIGluaXRpYWwucHJpbWFyeS5tYWluID0gdGhpcy5UaGVtZXNbMF0uUHJpbWFyeTtcclxuICAgIGluaXRpYWwuYWNjZW50Lm1haW4gPSB0aGlzLlRoZW1lc1swXS5BY2NlbnQ7XHJcbiAgICBpbml0aWFsLndhcm4ubWFpbiA9IHRoaXMuVGhlbWVzWzBdLldhcm47XHJcblxyXG4gICAgdGhpcy5QYWxldHRlID0gaW5pdGlhbDtcclxuXHJcbiAgICB0aGlzLnZhcmlhbnRDb2xvclNlcnZpY2UuVXBkYXRlUHJpbWFyeVZhcmlhbnRzKHRoaXMuVGhlbWVzWzBdLlByaW1hcnkpO1xyXG4gICAgdGhpcy52YXJpYW50Q29sb3JTZXJ2aWNlLlVwZGF0ZUFjY2VudFZhcmlhbnRzKHRoaXMuVGhlbWVzWzBdLkFjY2VudCk7XHJcbiAgICB0aGlzLnZhcmlhbnRDb2xvclNlcnZpY2UuVXBkYXRlV2FyblZhcmlhbnRzKHRoaXMuVGhlbWVzWzBdLldhcm4pO1xyXG5cclxuICB9XHJcbn1cclxuIl19