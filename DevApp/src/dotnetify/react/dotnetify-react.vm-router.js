/* 
Copyright 2017-2018 Dicky Suryadi

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */
import React from 'react';
import ReactDOM from 'react-dom';
import dotnetifyVMRouter from '../core/dotnetify-vm-router';
import $ from '../libs/jquery-shim';
import utils from '../libs/utils';

export default class dotnetifyReactVMRouter extends dotnetifyVMRouter {
  get hasRoutingState() {
    const state = this.vm.State();
    return state && state.hasOwnProperty('RoutingState');
  }
  get RoutingState() {
    return this.vm.State().RoutingState;
  }
  get VMRoot() {
    return this.vm.Props('vmRoot');
  }
  get VMArg() {
    return this.vm.Props('vmArg');
  }

  constructor(iVM, iDotNetifyRouter) {
    super(iVM, iDotNetifyRouter);
  }

  onRouteEnter(iPath, iTemplate) {
    if (!iTemplate.ViewUrl) iTemplate.ViewUrl = iTemplate.Id;
    return true;
  }

  // Loads a view into a target element.
  loadView(iTargetSelector, iViewUrl, iJsModuleUrl, iVmArg, iCallbackFn) {
    const vm = this.vm;
    let reactProps;

    // If the view model supports routing, add the root path to the view, to be used
    // to build the absolute route path, and view model argument if provided.
    if (this.hasRoutingState) {
      if (this.RoutingState === null) {
        console.error("router> the RoutingState prop of '" + vm.$vmId + "' was not initialized.");
        return;
      }

      let root = this.VMRoot;
      root = root != null ? '/' + utils.trim(this.RoutingState.Root) + '/' + utils.trim(root) : this.RoutingState.Root;
      reactProps = { vmRoot: root, vmArg: iVmArg };
    }

    // Provide the opportunity to override the URL.
    iViewUrl = this.router.overrideUrl(iViewUrl, iTargetSelector);
    iJsModuleUrl = this.router.overrideUrl(iJsModuleUrl, iTargetSelector);

    if (utils.endsWith(iViewUrl, 'html')) this.loadHtmlView(iTargetSelector, iViewUrl, iJsModuleUrl, iCallbackFn);
    else this.loadReactView(iTargetSelector, iViewUrl, iJsModuleUrl, reactProps, iCallbackFn);
  }

  // Loads an HTML view.
  loadHtmlView(iTargetSelector, iViewUrl, iJsModuleUrl, callbackFn) {
    const vm = this.vm;

    try {
      // Unmount any React component before replacing with a new DOM.
      ReactDOM.unmountComponentAtNode(document.querySelector(iTargetSelector));
    } catch (e) {
      console.error(e);
    }

    // Load the HTML view.
    $(iTargetSelector).load(iViewUrl, null, function() {
      if (iJsModuleUrl != null) {
        $.getScript(iJsModuleUrl, function() {
          if (typeof callbackFn === 'function') callbackFn.call(vm);
        });
      }
      else if (typeof callbackFn === 'function') callbackFn.call(vm);
    });
  }

  // Loads a React view.
  loadReactView(iTargetSelector, iReactClassOrClassName, iJsModuleUrl, iReactProps, callbackFn) {
    return new Promise((resolve, reject) => {
      const vm = this.vm;
      const vmId = this.vm ? this.vm.$vmId : '';
      const createViewFunc = () => {
        // Resolve the vue class from the argument, which can be the object itself, or a global window variable name.
        let reactClass = null;
        if (typeof iReactClassOrClassName === 'string' && window.hasOwnProperty(iReactClassOrClassName))
          reactClass = window[iReactClassOrClassName];
        else if (typeof iReactClassOrClassName === 'object' && iReactClassOrClassName.name) reactClass = iReactClassOrClassName;

        if (!reactClass) {
          console.error(`[${vmId}] failed to load view '${iReactClassOrClassName}' because it's not a React element.`);
          reject();
          return;
        }

        try {
          ReactDOM.unmountComponentAtNode(document.querySelector(iTargetSelector));
        } catch (e) {
          console.error(e);
        }

        try {
          var reactElement = React.createElement(reactClass, iReactProps);
          ReactDOM.render(reactElement, document.querySelector(iTargetSelector));
        } catch (e) {
          console.error(e);
        }
        if (typeof callbackFn === 'function') callbackFn.call(vm, reactElement);
        resolve(reactElement);
      };

      if (iJsModuleUrl == null || dotnetify.ssr === true) createViewFunc();
      else {
        // Load all javascripts first. Multiple files can be specified with comma delimiter.
        var getScripts = iJsModuleUrl.split(',').map(i => $.getScript(i));
        $.when.apply($, getScripts).done(createViewFunc);
      }
    });
  }
}
