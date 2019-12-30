(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){var DancingDots=require("dancing-dots");var delaunay=require("delaunay-fast");var headerEl=document.getElementById("header");var canvasEl=document.getElementById("headerCanvas");var ctx=canvasEl.getContext("2d");var triangles;var headerSizes=headerEl.getBoundingClientRect();const originalRatio=Math.round(headerSizes.width/headerSizes.height*100);var dancingDotsIntance=new DancingDots({getOnlyInts:false,dotCount:50,speed:.04,height:100,width:originalRatio});function updateTriangles(){var headerSizes=headerEl.getBoundingClientRect();var dotsBase=[[0,0],[0,headerSizes.height],[headerSizes.width,0],[headerSizes.width,headerSizes.height],[headerSizes.width/2,0],[headerSizes.width/2,headerSizes.height]];var dots=dotsBase.concat(dancingDotsIntance.getCoordsAndUpdate().map(function(dot){return[dot.x/originalRatio*headerSizes.width,dot.y/100*headerSizes.height]}));triangles=delaunay.triangulate(dots)}function draw(){var headerSizes=headerEl.getBoundingClientRect();var dotsBase=[[0,0],[0,headerSizes.height],[headerSizes.width,0],[headerSizes.width,headerSizes.height],[headerSizes.width/2,0],[headerSizes.width/2,headerSizes.height]];var dots=dotsBase.concat(dancingDotsIntance.getCoordsAndUpdate().map(function(dot){return[dot.x/originalRatio*headerSizes.width,dot.y/100*headerSizes.height]}));canvasEl.width=headerSizes.width;canvasEl.height=headerSizes.height;for(var i=triangles.length;i;){ctx.beginPath();ctx.strokeStyle="#333";--i;ctx.moveTo(dots[triangles[i]][0],dots[triangles[i]][1]);--i;ctx.lineTo(dots[triangles[i]][0],dots[triangles[i]][1]);--i;ctx.lineTo(dots[triangles[i]][0],dots[triangles[i]][1]);ctx.closePath();ctx.stroke()}dots.forEach(function(dot,dotIndex){drawCircle(dot[0],dot[1])});function drawCircle(x,y,intensity){ctx.beginPath();ctx.arc(x,y,3,0,2*Math.PI,false);ctx.fillStyle="#333";ctx.fill()}window.requestAnimationFrame(draw)}updateTriangles();window.setInterval(updateTriangles,8192);window.requestAnimationFrame(draw)},{"dancing-dots":2,"delaunay-fast":3}],2:[function(require,module,exports){"use strict";var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor)}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor}}();function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function")}}(function(){var DancingDots=function(){function DancingDots(){var args=arguments.length<=0||arguments[0]===undefined?{}:arguments[0];_classCallCheck(this,DancingDots);var _args$dotCount=args.dotCount;var dotCount=_args$dotCount===undefined?10:_args$dotCount;var _args$width=args.width;var width=_args$width===undefined?100:_args$width;var _args$height=args.height;var height=_args$height===undefined?100:_args$height;var _args$speed=args.speed;var speed=_args$speed===undefined?5:_args$speed;var _args$getOnlyInts=args.getOnlyInts;var getOnlyInts=_args$getOnlyInts===undefined?true:_args$getOnlyInts;this.dotCount=dotCount;this.width=width;this.height=height;this.speed=speed;this.getOnlyInts=getOnlyInts;this.coords=[];for(var x=0;x<this.dotCount;x++){this.coords.push({x:Math.floor(Math.random()*this.width),y:Math.floor(Math.random()*this.height),angle:Math.floor(Math.random()*2*Math.PI),angleDelta:Math.random()*.2-.1})}}_createClass(DancingDots,[{key:"getCoords",value:function getCoords(){var _this=this;return this.coords.map(function(el){return{x:_this.getOnlyInts?Math.round(el.x):el.x,y:_this.getOnlyInts?Math.round(el.y):el.y}})}},{key:"update",value:function update(){var _this2=this;this.coords.forEach(function(el){var newX=el.x+Math.sin(el.angle)*_this2.speed;var newY=el.y+Math.cos(el.angle)*_this2.speed;var newAngle=undefined;if(newX<0||newX>_this2.width||newY<0||newY>_this2.height){newAngle=(el.angle+Math.PI)%(Math.PI*2)}else{newAngle=(el.angle+el.angleDelta)%(Math.PI*2)}el.x=Math.max(0,Math.min(_this2.width,newX));el.y=Math.max(0,Math.min(_this2.height,newY));el.angle=newAngle})}},{key:"getCoordsAndUpdate",value:function getCoordsAndUpdate(){this.update();return this.getCoords()}}]);return DancingDots}();if(typeof module!=="undefined"&&typeof module.exports!=="undefined"){module.exports=DancingDots}else window.DancingDots=DancingDots})()},{}],3:[function(require,module,exports){var Delaunay;(function(){"use strict";var EPSILON=1/1048576;function supertriangle(vertices){var xmin=Number.POSITIVE_INFINITY,ymin=Number.POSITIVE_INFINITY,xmax=Number.NEGATIVE_INFINITY,ymax=Number.NEGATIVE_INFINITY,i,dx,dy,dmax,xmid,ymid;for(i=vertices.length;i--;){if(vertices[i][0]<xmin)xmin=vertices[i][0];if(vertices[i][0]>xmax)xmax=vertices[i][0];if(vertices[i][1]<ymin)ymin=vertices[i][1];if(vertices[i][1]>ymax)ymax=vertices[i][1]}dx=xmax-xmin;dy=ymax-ymin;dmax=Math.max(dx,dy);xmid=xmin+dx*.5;ymid=ymin+dy*.5;return[[xmid-20*dmax,ymid-dmax],[xmid,ymid+20*dmax],[xmid+20*dmax,ymid-dmax]]}function circumcircle(vertices,i,j,k){var x1=vertices[i][0],y1=vertices[i][1],x2=vertices[j][0],y2=vertices[j][1],x3=vertices[k][0],y3=vertices[k][1],fabsy1y2=Math.abs(y1-y2),fabsy2y3=Math.abs(y2-y3),xc,yc,m1,m2,mx1,mx2,my1,my2,dx,dy;if(fabsy1y2<EPSILON&&fabsy2y3<EPSILON)throw new Error("Eek! Coincident points!");if(fabsy1y2<EPSILON){m2=-((x3-x2)/(y3-y2));mx2=(x2+x3)/2;my2=(y2+y3)/2;xc=(x2+x1)/2;yc=m2*(xc-mx2)+my2}else if(fabsy2y3<EPSILON){m1=-((x2-x1)/(y2-y1));mx1=(x1+x2)/2;my1=(y1+y2)/2;xc=(x3+x2)/2;yc=m1*(xc-mx1)+my1}else{m1=-((x2-x1)/(y2-y1));m2=-((x3-x2)/(y3-y2));mx1=(x1+x2)/2;mx2=(x2+x3)/2;my1=(y1+y2)/2;my2=(y2+y3)/2;xc=(m1*mx1-m2*mx2+my2-my1)/(m1-m2);yc=fabsy1y2>fabsy2y3?m1*(xc-mx1)+my1:m2*(xc-mx2)+my2}dx=x2-xc;dy=y2-yc;return{i:i,j:j,k:k,x:xc,y:yc,r:dx*dx+dy*dy}}function dedup(edges){var i,j,a,b,m,n;for(j=edges.length;j;){b=edges[--j];a=edges[--j];for(i=j;i;){n=edges[--i];m=edges[--i];if(a===m&&b===n||a===n&&b===m){edges.splice(j,2);edges.splice(i,2);break}}}}Delaunay={triangulate:function(vertices,key){var n=vertices.length,i,j,indices,st,open,closed,edges,dx,dy,a,b,c;if(n<3)return[];vertices=vertices.slice(0);if(key)for(i=n;i--;)vertices[i]=vertices[i][key];indices=new Array(n);for(i=n;i--;)indices[i]=i;indices.sort(function(i,j){return vertices[j][0]-vertices[i][0]});st=supertriangle(vertices);vertices.push(st[0],st[1],st[2]);open=[circumcircle(vertices,n+0,n+1,n+2)];closed=[];edges=[];for(i=indices.length;i--;edges.length=0){c=indices[i];for(j=open.length;j--;){dx=vertices[c][0]-open[j].x;if(dx>0&&dx*dx>open[j].r){closed.push(open[j]);open.splice(j,1);continue}dy=vertices[c][1]-open[j].y;if(dx*dx+dy*dy-open[j].r>EPSILON)continue;edges.push(open[j].i,open[j].j,open[j].j,open[j].k,open[j].k,open[j].i);open.splice(j,1)}dedup(edges);for(j=edges.length;j;){b=edges[--j];a=edges[--j];open.push(circumcircle(vertices,a,b,c))}}for(i=open.length;i--;)closed.push(open[i]);open.length=0;for(i=closed.length;i--;)if(closed[i].i<n&&closed[i].j<n&&closed[i].k<n)open.push(closed[i].i,closed[i].j,closed[i].k);return open},contains:function(tri,p){if(p[0]<tri[0][0]&&p[0]<tri[1][0]&&p[0]<tri[2][0]||p[0]>tri[0][0]&&p[0]>tri[1][0]&&p[0]>tri[2][0]||p[1]<tri[0][1]&&p[1]<tri[1][1]&&p[1]<tri[2][1]||p[1]>tri[0][1]&&p[1]>tri[1][1]&&p[1]>tri[2][1])return null;var a=tri[1][0]-tri[0][0],b=tri[2][0]-tri[0][0],c=tri[1][1]-tri[0][1],d=tri[2][1]-tri[0][1],i=a*d-b*c;if(i===0)return null;var u=(d*(p[0]-tri[0][0])-b*(p[1]-tri[0][1]))/i,v=(a*(p[1]-tri[0][1])-c*(p[0]-tri[0][0]))/i;if(u<0||v<0||u+v>1)return null;return[u,v]}};if(typeof module!=="undefined")module.exports=Delaunay})()},{}]},{},[1]);