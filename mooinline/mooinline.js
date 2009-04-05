/* Copyright November 2008, Sam Goody, ssgoodman@gmail.com 
*   Licensed under the Open Source License
*
* 	Authors:		
*		Sam Goody (ssgoodman@gmail.com)
*		Mark Kohen
*		T. Anolik
*	Credits:
*	Entirely based on the tutorial at: http://dev.opera.com/articles/view/rich-html-editing-in-the-browser-part-1.  Great job, Olav!!
*	Ideas and inspiration: Guillerr, MooEditable
*	Icons from OpenWysiwyg - http://www.openwebware.com
*	Many of the cleanup regexs from CheeAun and Ryan's work on MooEditable
*	We really want your help!  Please join!!
*/

var MooInline = new Class({
	
	Implements: [Options],

	options:{
		floating: false,
		location: 'elements', 											   			//[e,n,t,b,'']
		defaults: 'Toolbar:[Main,File,Link,Justify,Lists,Indents,|,Html/Text,fuUploadBar,|,save]'
	},
	
	initialize: function(selectors, options){
		//console.log('called')
		//console.log(selectors)
		if($type(selectors)=='object'){options = selectors; selectors = null};
		this.setOptions(options);
		var self = this, mi, els = $$(selectors||'textarea, .RTE'), l = this.options.location.substr(4,1).toLowerCase();
		MooInline.activeField = MooInline.activeBtn = MooInline.activeBar = ''; MooInline.ranges = MooInline.shortcuts = MooInline.removed = $H({});	// = MooInline.shortcutBtns = 
		
		els.each(function(el){
			if(el.get('tag') == 'textarea' || el.get('tag') == 'input') el = self.textArea(el);
			if(l=='e' || !mi) mi = self.insertToolbar(l);  							//[L]ocation == elem[e]nts. [Creates bar if none or, when 'elements', for each element]
			if(l=='b' || l=='t' || !l) el.set('contentEditable', true).focus();		//[L]ocation == page[t]op, page[b]ottom, none[] 
			else l=='e' ? self.positionToolbar(el,mi) : el.addEvents({				//[L]ocation == elem[e]nts ? inli[n]e
				'click': function(){ self.positionToolbar(el, mi); },
				'blur':function(){ 
					mi.addClass('miHide'); this.set('contentEditable', false);	
				}
			});
			el.store('bar', mi).addEvents({
			//el.addEvents({
				'mouseup':MooInline.Utilities.updateBtns, 
				'keyup'  :MooInline.Utilities.updateBtns, 
				'keydown':MooInline.Utilities.shortcuts, 
				'focus'  :function(){ MooInline.activeField = this; MooInline.activeBar = mi; } //this.retrieve('bar');activeField is not used at all, activeBar is used for the button check.
			});
		})
		
		//MooInline.activeBar = (MooInline.activeField = els[0]).retrieve('bar');								//in case a button is pressed before anything is selected.
		els[0].fireEvent('focus');//,els[0]
		if(l=='t') mi.addClass('miPageTop').getFirst().addClass('miTopDown');
		else if(l=='b') mi.addClass('miPageBottom');
	},
	
	insertToolbar: function (pos){
		var mi = new Element('div', {'class':'miRemove miMooInline '+(!pos||pos=='n'?'miHide':''), 'contentEditable':false }).adopt(
			 new Element('div', {'class':'miRTE' })
		).inject(document.body);
		MooInline.activeBtn = mi.getFirst();  // not used!
		MooInline.Utilities.addElements(this.options.defaults, mi.getFirst(), 'bottom', '', [], 0)
		return mi;
	},
	
	positionToolbar: function (el, mi){												//function is sloppy.  Clean!
		el.set('contentEditable', true).focus();
		var elSize = el.getCoordinates(), f=this.options.floating;
		mi.removeClass('miHide').setStyle('width',elSize.width).store('fields', mi.retrieve('fields', []).include(el));
		if(f) mi.setStyles({ 'left':elSize.left, 'top':(elSize.top - mi.getFirst().getCoordinates().height > 0 ? elSize.top : elSize.bottom) }).addClass('miFloat').getFirst().addClass('miFloat');
		else mi.inject((el.getParent().hasClass('miTextArea')?el.getParent():el),'top'); //'before'
	},
	
	textArea: function (el){
		var div = new Element('div', {text:el.get('value')});
		new Element('div', {'class':'miTextArea '+el.get('class'), 'styles':el.getCoordinates() }).adopt(div, new Element('span')).setStyle('overflow','auto').inject(el, 'before');
		el.addClass('miHide');
		return div;
	}
})

MooInline.Utilities = {
	exec: function(args){
		args = $A(arguments).flatten(); 											// args can be an array (for the hash), or regular arguments(elsewhere).
		var g = (Browser.Engine.gecko && 'ju,in,ou'.contains(args[0].substr(0,2).toLowerCase()));	//Fix for FF3 bug for justify, in&outdent
		if(g) document.designMode = 'on';
		document.execCommand(args[0], args[2]||false, args[1]||null);				//document.execCommand('justifyRight', false, null);//document.execCommand('createlink', false, 'http://www.google.com');
		if(g) document.designMode = 'off';
	},
	
	storeRange:function(rangeName){
		var sel = window.getSelection ? window.getSelection() : window.document.selection;
		if (!sel) return null;
		MooInline.ranges[rangeName || 1] = sel.rangeCount > 0 ? sel.getRangeAt(0) : (sel.createRange ? sel.createRange() : null);
	},
	
	setRange: function(rangeName) {
		var range = MooInline.ranges[rangeName || 1]
		if(range.select) range.select(); 
		else{	
			var sel = window.getSelection ? window.getSelection() : window.document.selection;
			if (sel.addRange){
				sel.removeAllRanges();
				sel.addRange(range);
			}
		}
 	},
	
	shortcuts: function(e){
		var be, btn;	
		if(e && e.control && MooInline.shortcuts.has(e.key)){	
			e.stop();
			btn = MooInline.activeBar.getElement('.mi'+MooInline.shortcuts[e.key])
			btn.fireEvent('mousedown', btn)
		};
	},
	
	updateBtns: function(e){
		var be;
		[	'bold','italic','underline','strikethrough','subscript','superscript','justifyleft','justifycenter',
			'JustifyRight','justifyfull','insertorderedlist','insertunorderedlist','unlink'
		].each(function(prop){		
			if (be = MooInline.activeBar.getElement('.mi'+prop))
				window.document.queryCommandState(prop) ? be.addClass('miSelected') : be.removeClass('miSelected');
		});
		['fontSize'].each(function(prop){	
			if (be = MooInline.activeBar.getElement('.mi'+prop))
				window.document.queryCommandValue(prop) ? be.addClass('miSelected') : be.removeClass('miSelected');
		}); 
	},
	
	addElements: function(buttons, place, relative, name, hides, invisible){
		
		if(!hides) hides = '';
		if(!place) place = MooInline.activeBtn;
		var parent = place.hasClass('miRTE') ? place : place.getParent('.miRTE'), self = this, btns = [], img, loop; 
		if($type(buttons) == 'string'){
			buttons = buttons.replace(/'([^']*)'|"([^"]*)"|([^{}:,\][\s]+)/gm, "'$1$2$3'"); 					// surround strings with single quotes.  Convert double to single quoutes. 
			buttons = buttons.replace(/((?:[,[:]|^)\s*)('[^']+'\s*:\s*'[^']+'\s*(?=[\],}]))/gm, "$1{$2}");		// add curly braces to string:string - makes {string:string} 
			buttons = buttons.replace(/((?:[,[:]|^)\s*)('[^']+'\s*:\s*{[^{}]+})/gm, "$1{$2}");					// add curly braces to string:object.  Eventually fix to allow recursion.
			while (buttons != (buttons = buttons.replace(/((?:[,[]|^)\s*)('[^']+'\s*:\s*\[(?:(?=([^\],\[]+))\3|\]}|[,[](?!\s*'[^']+'\s*:\s*\[([^\]]|\]})+\]))*\](?!}))/gm, "$1{$2}")));	// add curly braces to string:array.  Allows for recursive objects - {a:[{b:[c]}, [d], e]}.
			buttons = JSON.decode('['+buttons+']');
		}
		
		var loopStop = 0; //remove after testing!!
		do{
			if(btns[0]){ buttons = btns; btns = [];}
			$splat(buttons).each(function(item){
				switch($type(item)){
					case 'string': btns.push(item); break;
					case 'array' : item.each(function(val){btns.push(val)}); var loop = (item.length==1); break;	//item.each(buttons.push);
					case 'object': Hash.each(item, function(val,key){var newObj = {}; newObj[key] = val; btns.push(newObj)}); break;			
				}
			});
		} while(loop && ++loopStop < 5);
		
		btns.each(function(btn){
			var btnVals;
			if ($type(btn)=='object'){btnVals = Hash.getValues(btn)[0]; btn = Hash.getKeys(btn)[0];}
			var e = parent.getElement('.'+name||'.mi'+btn);
			
			if(!e){
				var bgPos = 0, val = MooInline.Elements[btn], input = 'text,password,submit,button,checkbox,file,hidden,image,radio,reset'.contains(val.type), textarea = (val.element && val.element.toLowerCase() == 'textarea');
				if (!isNaN(val.img)){ bgPos = val.img; img = 'mooinline/images/i.gif' };						//if number, image is assumed to be default, position is number
			
				var properties = $H({
					href:'javascript:void(0)',
					unselectable:(input || textarea ? 'off' : 'on'),
					title: btn + (val.shortcut ? ' (Ctrl+'+val.shortcut.capitalize()+')':''),	
					styles:img ? {'background-image':'url('+img+')', 'background-position':(-2+-18*bgPos)+'px -2px'}:'',
					events:{
						'mousedown': function(e){
							MooInline.activeBtn = this;
							MooInline.activeBar = this.getParent('.miMooInline');
							if(!val.onClick && (!val.element || val.element == 'a')) MooInline.Utilities.exec(val.args||btn);
							MooInline.Utilities.run(val.onClick, val.args, val.hides, parent, this, btn)
							if(e && e.stop) input || textarea ? e.stopPropagation() : e.stop();					//if input accept events, which means keeping it from propogating to the stop of the parent!!
							
							this.getParent().getChildren().removeClass('miSelected');
							if(!val.ignoreState)this.addClass('miSelected');
						}
					}
				}).extend(val);
				['args','shortcut','element','onClick','img','onLoad','onExpand','onHide',(val.element?'href':'null'),(Browser.Engine.trident?'':'unselectable')].map(properties.erase.bind(properties));
				e = new Element((input && !val.element ? 'input' : val.element||'a'), properties.getClean()).inject(place,relative||'bottom').addClass((name||'')+' mi'+(val.title||btn));
				
				if (btnVals) e.store('children', btnVals);
				//if (val.shortcut){MooInline.shortcuts.include(val.shortcut); MooInline.shortcutBtns.include(btn);} 
				if (val.shortcut){ MooInline.shortcuts[val.shortcut] = btn; } 
				MooInline.Utilities.run(val.onInit, val.args, val.hides, parent, e, btn);
				if (btnVals) MooInline.Utilities.addElements(btnVals, e);
				else if (val.contains) MooInline.Utilities.addElements(val.contains, e);	
				MooInline.Utilities.run(val.onLoad, val.args, val.hides, parent, e, btn);
				e.removeClass('miHide');
				//if (collection.getCoordinates().top < 0)toolbar.addClass('miTopDown'); //untested!!
			}
			e.removeClass('miHide')
		})
	},
	
	run: function(prop, args, hides, self, caller, name, el){						//el is not passed, it is being declared.
		if(!prop) return;
		switch($type(prop)){
			case 'function': prop.bind(caller)(args); return;
			case 'string': 
				'onLoad,onClick,onInit'.contains(prop) ? MooInline.Utilities.run(MooInline.Elements[name][prop], args, hides, self, caller, name)
				: MooInline.Utilities[prop] ? MooInline.Utilities[prop].bind(self)(args) 
				: MooInline.Utilities.addElements(prop, self, 'bottom', 'miGroup_'+name, hides, 0); 
			break;
			default:
				if(hides = (hides || caller.getParent().retrieve('children'))) hides.each(function(clas){
					if(el = self.getElement('.miGroup_'+clas)) el.addClass('miHide')
				})
				MooInline.Utilities.addElements(prop, self, 'bottom', 'miGroup_'+name, hides, 0); 				
			break; 																	//case 'object': case 'array'
		}
	},
	/*
	remove: function(mi, keep){							// I plan on extending elements with remove() as well as hide() and deleting this.
		mi = mi.hasClass('miMooInline') ? mi : mi.retrieve('bar');
		if(!keep) mi.destroy();
		else if(keep === true) mi.addClass('.miHide');
		else{ MooInline.removed[keep] = mi; new Element('span').replaces(mi).destroy(); } 
	},
	*/
	clean: function(html, options){
	
	
		options = $H({
			xhtml:false, 
			semantic:true, 
			remove:''
		}).extend(options);
		
		var br = '<br'+(xhtml?'/':'')+'>';
		var xhtml = [
			[/(<(?:img|input)[^\/>]*)>/g, '$1 />']									// Greyed out -  make img tags xhtml compatable 	#if (this.options.xhtml)
		];
		var semantic = [
			[/<li>\s*<div>(.+?)<\/div><\/li>/g, '<li>$1</li>'],						// remove divs from <li>		#if (Browser.Engine.trident)
			[/<span style="font-weight: bold;">(.*)<\/span>/gi, '<strong>$1</strong>'],	 			//
			[/<span style="font-style: italic;">(.*)<\/span>/gi, '<em>$1</em>'],					//
			[/<b\b[^>]*>(.*?)<\/b[^>]*>/gi, '<strong>$1</strong>'],									//
			[/<i\b[^>]*>(.*?)<\/i[^>]*>/gi, '<em>$1</em>'],											//
			[/<u\b[^>]*>(.*?)<\/u[^>]*>/gi, '<span style="text-decoration: underline;">$1</span>'],	//
			[/<p>[\s\n]*(<(?:ul|ol)>.*?<\/(?:ul|ol)>)(.*?)<\/p>/ig, '$1<p>$2</p>'], 				// <p> tags around a list will get moved to after the list.  not working properly in safari? #if (['gecko', 'presto', 'webkit'].contains(Browser.Engine.name))
			[/<\/(ol|ul)>\s*(?!<(?:p|ol|ul|img).*?>)((?:<[^>]*>)?\w.*)$/g, '</$1><p>$2</p>'],		// ''
			[/<br[^>]*><\/p>/g, '</p>'],											// Remove <br>'s that end a paragraph here.
			[/<p>\s*(<img[^>]+>)\s*<\/p>/ig, '$1\n'],				 				// If a <p> only contains <img>, remove the <p> tags	
			[/<p([^>]*)>(.*?)<\/p>(?!\n)/g, '<p$1>$2</p>\n'], 						// Break after paragraphs
			[/<\/(ul|ol|p)>(?!\n)/g, '</$1>\n'],	    							// Break after </p></ol></ul> tags
			[/><li>/g, '>\n\t<li>'],          										// Break and indent <li>
			[/([^\n])<\/(ol|ul)>/g, '$1\n</$2>'],    								// Break before </ol></ul> tags
			[/([^\n])<img/ig, '$1\n<img'],    										// Move images to their own line
			[/^\s*$/g, '']										        			// Delete empty lines in the source code (not working in opera)
		];
		var nonSemantic = [	
			[/\s*<br ?\/?>\s*<\/p>/gi, '</p>']										// if (!this.options.semantics) - Remove padded paragraphs
		];	
		var appleCleanup = [
			[/<br class\="webkit-block-placeholder">/gi, "<br />"],					// Webkit cleanup - add an if(webkit) check
			[/<span class="Apple-style-span">(.*)<\/span>/gi, '$1'],				// Webkit cleanup - should be corrected not to get messed over on nested spans - SG!!!
			[/ class="Apple-style-span"/gi, ''],									// Webkit cleanup
			[/<span style="">/gi, ''],												// Webkit cleanup	
			[/^([\w\s]+.*?)<div>/i, '<p>$1</p><div>'],								// remove stupid apple divs 	#if (Browser.Engine.webkit)
			[/<div>(.+?)<\/div>/ig, '<p>$1</p>']									// remove stupid apple divs 	#if (Browser.Engine.webkit)
		];
		var cleanup = [
			[/<br\s*\/?>/gi, br],													// Fix BRs, make it easier for next BR steps.
			[/><br\/?>/g, '>'],														// Remove (arguably) useless BRs
			[/^<br\/?>/g, ''],														// Remove leading BRs - perhaps combine with removing useless brs.
			[/<br\/?>$/g, ''],														// Remove trailing BRs
			[/<br\/?>\s*<\/(h1|h2|h3|h4|h5|h6|li|p)/gi, '</$1'],					// Remove BRs from end of blocks
			[/<p>\s*<br\/?>\s*<\/p>/gi, '<p>\u00a0</p>'],							// Remove padded paragraphs - replace with non breaking space
			[/<p>(&nbsp;|\s)*<\/p>/gi, '<p>\u00a0</p>'],							// ''
			[/<p>\W*<\/p>/g, ''],													// Remove ps with other stuff, may mess up some formatting.
			[/<\/p>\s*<\/p>/g, '</p>'],												// Remove empty <p> tags
			[/<[^> ]*/g, function(match){return match.toLowerCase();}],				// Replace uppercase element names with lowercase
			[/<[^>]*>/g, function(match){											// Replace uppercase attribute names with lowercase
			   match = match.replace(/ [^=]+=/g, function(match2){return match2.toLowerCase();});
			   return match;
			}],
			[/<[^>]*>/g, function(match){											// Put quotes around unquoted attributes
			   match = match.replace(/( [^=]+=)([^"][^ >]*)/g, "$1\"$2\"");
			   return match;
			}]
		];
		var depracated = [
			// The same except for BRs have had optional space removed
			[/<p>\s*<br ?\/?>\s*<\/p>/gi, '<p>\u00a0</p>'],							// modified as <br> is handled previously
			[/<br>/gi, "<br />"],													// Replace improper BRs if (this.options.xhtml) Handled at very beginning			
			[/<br ?\/?>$/gi, ''],													// Remove leading and trailing BRs
			[/^<br ?\/?>/gi, ''],													// Remove trailing BRs
			[/><br ?\/?>/gi,'>'],													// Remove useless BRs
			[/<br ?\/?>\s*<\/(h1|h2|h3|h4|h5|h6|li|p)/gi, '</$1'],					// Remove BRs right before the end of blocks
			//Handled with DOM:
			[/<p>(?:\s*)<p>/g, '<p>'],												// Remove empty <p> tags
		];
				
		/* 
		//If html is an element, process all of that element's innards.  Perhaps even offer taking the outerhtml.  If not, use a separate element to dump stuff into.
		For washer, we can use a iframe instead of an element - may be needed for the whole body or similar.
		var washer = ( $('washer') ? $('washer') : new IFrame({ id:'washer', 'class':'mHide' }).inject(document.body)).contentWindow.document;
		washer.open();
		washer.write('<html><body id="washer">'+html+'</body></html>');
		washer.close();
		washer = $(washer.body);
		*/
		
		var washer;
		if($type(html)=='element'){
			washer = html;
			html = washer.get('html');
			washer.mooinline('remove');
		} else washer = $('washer') || new Element('div',{id:'washer'}).inject(document.body);

		washer.getElements('p:empty'+(options.remove ? ','+options.remove : '')).destroy();
		if(!Browser.Engine.gecko) washer.getElements('p>p:only-child').each(function(el){ var p = el.getParent(); if(p.childNodes.length == 1) el.replaces(p)  });  // The following will not apply in Firefox, as it redraws the p's to surround the inner one with empty outer ones.  It should be tested for in other browsers. 
		//$$('p>p:only-child').each(function(el){ var p = el.getParent(); if(p.childNodes.length == 1) $el.replaces(p)  });
		//$$('br:last-child').each(function(el){ if(!el.nextSibling && 'h1h2h3h4h5h6lip'.contains(el.getParent().get('tag'))) el.destroy(); });		//$$('br:last-child').filter(function(el) { return !el.nextSibling; })
		html = washer.get('html');
		
		if(xhtml)cleanup.extend(xhtml);
		if(semantic)cleanup.extend(semantic);
		if(Browser.Engine.webkit)cleanup.extend(appleCleanup);

		var loopStop = 0;
		do{	
			var cleaned = html;
			cleanup.each(function(reg){ html = html.replace(reg[0], reg[1]); });		
		} while (cleaned != html && ++loopStop <2);
		html = html.trim();
		if(washer != $('washer')) washer.mooinline();
		return html;
	}
}

Element.implement({
//$$('div.RTE')[0].mooinline();
	mooinline:function(directive, options){
		var bar = this.hasClass('miMooInline') ? this : this.retrieve('bar') || '';
		if(!directive || (directive == 'create')){
			if(removed = this.retrieve('removed')){
				this.grab(removed, 'top');
				this.store('removed','');
			} else return bar ? this.removeClass('miHide') : new MooInline(this, options);
		}else{
			if(!bar) return false;
			else switch(directive.toLowerCase()){
				case 'hide': bar.addClass('miHide'); break;
				case 'remove': this.store('removed', bar); new Element('span').replaces(bar).destroy();  break;
				case 'destroy': bar.retrieve('fields').each(function(el){el.removeEvents().store('bar','').contentEditable = false;}); bar.destroy(); break; 
			}
		}
	}
});

MooInline.Elements = new Hash({

	'Defaults'     :{onLoad:{Toolbar:['Main','File','Link','Justify','Lists','Indents','|','Html/Text','fuUploadBar']}},	//group - defaults
	'Main'         :{img: '0', onLoad:{Toolbar:['bold','italic','underline','strikethrough','subscript','superscript']}, onClick:'onLoad' },//console.log()//group - 'Main','File','Link','Justify','Lists','Indents','|','Html/Text','fuUploadBar'
	'File'         :{img: '9', onClick:{Toolbar:['paste','copy','cut','redo','undo']} },
	'Link'         :{img: '6', onClick:{Toolbar:['l0','l1','l2','unlink']},  checkState:true},
	'Justify'      :{img:'18', onClick:'Toolbar:[justifyleft,justifycenter,JustifyRight,justifyfull]' },
	'Lists'        :{img:'22', onClick:{Toolbar:['insertorderedlist','insertunorderedlist']} },
	'Indents'      :{img:'16', onClick:{Toolbar:['indent','outdent']} },//, init:function(){ console.log(this); this.fireEvent('mousedown')} },
	
	'Toolbar'      :{element:'div'},//, 'class':'miToolbar'
	
	'|'            :{text:'|', title:'', element:'span'},
	'bold'         :{img:'0', shortcut:'b' },
	'italic'       :{img:'1', shortcut:'i' },
	'underline'    :{img:'2', shortcut:'u' },
	'strikethrough':{img:'3', shortcut:'s' },
	'subscript'    :{img:'4'},
	'superscript'  :{img:'5'},
	'indent'       :{img:'16'},
	'outdent'      :{img:'17'},
	'paste'        :{img:'9', title:'Paste (Ctrl+V)'},
	'copy'         :{img:'7', title:'Copy (Ctrl+C)'},
	'cut'          :{img:'8', title:'Cut (Ctrl+X)'},
	'redo'         :{img:'13', shortcut:'Y' },
	'undo'         :{img:'12', shortcut:'Z' },
	'justifyleft'  :{img:'20', title:'Justify Left'  },
	'justifycenter':{img:'18', title:'Justify Center'},
	'JustifyRight' :{img:'21', title:'Justify Right' },
	'justifyfull'  :{img:'19', title:'Justify Full'  },
	'insertorderedlist'  :{img:'22', title:'Numbered List'},
	'insertunorderedlist':{img:'23', title:'Bulleted List'},
	'test'         :{onClick:function(){console.log(arguments)}, args:this},
	'l0'           :{'text':'enter the url', element:'span' },
	'l1'           :{'type':'text',  'onClick':MooInline.Utilities.storeRange }, 
	'l2'           :{'type':'submit', events:{'mousedown':function(e){e.stopPropagation();}, 'onClick':function(e){ MooInline.Utilities.setRange(); MooInline.Utilities.exec('createlink',this.getPrevious().get('value')); e.stop()}}, 'value':'add link' },
	//'l2'         :{'type':'submit', 'onClick':function(){ MooInline.Utilities.setRange(); MooInline.Utilities.exec('createlink',this.getPrevious().get('value'))}, 'value':'add link' },
	'nolink'       :{'text':'please select the text to be made into a link'},
	'unlink'       :{img:'6'},
	'remoteURL'    :{onClick:['imgSelect','imgInput','insertimage']},
	'imgSelect'    :{element:'span', text:'URL of image' },
	'imgInput'     :{type:'text' },
	'insertimage'  :{onClick:function(args, classRef){ 
						classRef.exec([this.getParent().getElement('input[type=text]').get('text')]) 
					}},
	'inserthorizontalrule':{img:'22'},	
	'save'         :{ img:'11', onClick:function(){
						var content = $H({ 'page': window.location.pathname });
						this.getParent('.miMooInline').retrieve('fields').each(function(el){
							content['content_'+(el.get('id')||'')] = MooInline.Utilities.clean(el);
						});
						console.log(content)
						var savePath = new Request({url:'mooinline/plugins/save/saveFile.php'}).send(content.toQueryString()); 
						//console.log('ready to clean')
						//console.log('content:', content);
						//console.log('content:', MooInline.activeBar.retrieve('fields')); // same as this.getParent('.miMooInline').retrieve('field')
						//it.grab(MooInline.removed.washer, 'top')
						//MooInline.removed.washer.inject(it, 'top');
						//console.log(MooInline.removed.washer);
					}},
	'Html/Text'    :{ img:'26', onClick:['DisplayHTML']}, 
	'DisplayHTML'  :{ element:'textarea', 'class':'displayHtml', unselectable:'off', init:function(){ 
						var el=this.getParent('.miMooInline').retrieve('fields'), p = el.getParent(); 
						var size = (p.hasClass('miTextArea') ? p : el).getSize(); 
						this.set({'styles':{width:size.x, height:size.y}, 'text':el.innerHTML.trim()})
					}},
	'colorpicker'  :{ 'element':'img', 'src':'images/colorPicker.jpg', 'class':'colorPicker', onClick:function(){
						//c[i] = ((hue - brightness) * saturation + brightness) * 255;  hue=angle of ColorWheel.  saturation =percent of radius, brightness = scrollWheel.
						var c, radius = this.getSize().x/2, x = mouse.x - radius, y = mouse.y - radius, brightness = hue.y / hue.getSize().y, hue = Math.atan2(x,y)/Math.PI * 3 - 2, saturation = Math.sqrt(x*x+y*y) / radius;
						for(i=0;i<3;i++) c[i] = ((((h=Math.abs(++hue)) < 1 ? 1 : h > 2 ? 0 : -(h-2)) - brightness) * saturation + brightness) * 255;  
						c[1] = -(c[2] - 255*saturation);
						var hex = c.rgbToHex();
					}},
	'fuUploadBar'  :{ title:'Upload Image', img:25, onClick:'Toolbar:[fuBrowse,fuUpload,fuClear,fuStatus,fuList]'},
	'fuBrowse'     :{ id:"fuBrowse", element:'span', text:'Browse Files', title:''},
	'fuUpload'     :{ id:"fuUpload", onClick:'', element:'span', text:'Upload Files', title:''},
	'fuClear'      :{ id:"fuClear", element:'span', text:'Clear List' ,title:''},	
	'fuStatus'     :{ element:'span', id:'fuStatus', contains:'[fu1,fu2,fu3,fu4,fu5]'},
	'fu1'          :{ element:'strong', 'class':'overall-title'},
	'fu2'          :{ element:'strong', 'class':'current-title'},
	'fu3'          :{ element:'div',    'class':'current-text' },
	'fu4'          :{ element:'img',    'class':'progress overall-progress', src:'mooinline/plugins/fancyUpload/assets/progress-bar/bar.gif' },
	'fu5'          :{ element:'img',    'class':'progress current-progress', src:'mooinline/plugins/fancyUpload/assets/progress-bar/bar.gif' },
	'fuList'       :{ id:'fuList', style:'display:none', onInit:function(){
						Asset.javascript('mooinline/plugins/fancyUpload/fancyUpload.js');
						Asset.css('mooinline/plugins/fancyUpload/fancyUpload.css');
					}},
	'fuPhotoUpload':{ id:'demo-photoupload', element:'input', type:'file', name:'photoupload' },
	'loading..'    :{ 'class':'miLoading', 	element:'span', text:'loading...',title:''}
})


/* Known Issues:
1. Regex to convert string to object: Easy but tedious to fix - If these are important to anyone, let me know!
	a) will not ignore escaped qoutes.  Use double/single quotes. 
	b) Objects nested more than one layer deep will not become objects (a:b:c will become {a:{b:c}}), but so will a:b:c:d, which will become a:{b:{c:d}}
2. Throws an error sometimes when inline
3. When inline - clicking the bar should not make it dissapear!!
*/

/* Ideapad:
a) Add variable to signify whether or not buttons should be run.
b) Add support for args to be a function. Run function for value of args.
c) Editing functions should not work out of the scope of the toolbar's fields (I shouldn't be able to click on a button on the "wrong" toolbar, and certainly not a field is not meant to be editable.  Currently applies to shortcuts)
d) inline toolbar class should be added to button hash, for the who want all their toolbars on the same line (like toolbars in word)
e) create a structure to add or remove elements with a .mooInline().  Adding should be made available for all elements that are passed if option is set.
f) default styles for 'a' etc should be added to api docs
g) add object of functions it should check on each update key {widetBtn:function(){widteVar?true:false;}}
h) add an onExpand, onExpandHidden and onCollapse, and a onCollapse function
i) and a expanded() when all are, or a different set of rules for init on menus?
j) onIint:expand() and expandHidden should expand.
k) Add a tab button.
l) Add an onHide() handler
m) add the logic of hides to the API.
n) Logic for overflow [buttons that dont fit] should be added to either each button in the Hash, or globally.  Options should be noted.
o) Add invisible parameter to make invisible? or rely on adding the miHide class 
p) Should each passed in element of an object be checked if it exists?  If yes, how will it define what already exists?  [ie. mitoolbar exists many times, but the right one is needed.]  
	Perhaps, in the onLoad/onInit/onClick it should be able to take multiple classes inside parenthasis.  So toolbar(insertImage):['it0', 'it2(it3)'] should look for the element classed insertImage, and add a toolbar with that class if it does not exist. 
q) in index.htm it put the toolbar bottom left when floating.  should adjust for centering and for margins while floating.
r) should it prevent text from being inserted before it while inline?
s) pageTop & bottom should be inserted inline if float is false.

Design Decisions:
a) Logic of button check:
	at press, all other buttons within it's collection are reset.
	if execBtn - will be redepressed as needed.
	ignoreState == false, btn will show itself as pressed until reset (either by user function or by other button in collection being pressed). 
	ignoreState == true, button will not "press".  if a string, variable will be added to that which updateBtns checks on each press  [perhaps using the collection?].
b) What parameters should addCollection require?
	a) Currently handles following: a) buttons to add to collection.  b & c) placing d) name e) visibilty f) caller.
	Ideally should not require so much: 
		Buttons(cannot just pass location, as this is more flexible, and any button can have button list in more than one place)
		Containing div (key of object).  Optional, as it will use a plain div (with the styles of a tollbar from openwysiwyg) if none is passed.
		Group which the containing div is a part of.  -  explain - should groups be maintained separately?
*/
			
/* ChangeLog:
50:
a. Fixed - On index.html the inline bar is always showing 
b. it does not require elements, it test for an object while initing the class. 
c. When a string is passed to addCollection, it should wrap it in brackets, in case it is an array.  [commonly, arrays will be created without brackets].
d. onLoad can run 'onClick'
e. Invalid - (unsure of what is meant): press btn which will press key / expand menu, and run optional function afterwards.
*/

/* Old Code:
	//var bar = MooInline.activeBtn.getParent('.miRTE'), be, btn;//$chk(btn = MooInline.shortcuts.keyOf(e.key)) $chk to allow index 0, may not be needed. 
	//var bar = MooInline.activeField.retrieve('bar'), be, btn;	
	
	, btn;	
	if(e && e.control && MooInline.shortcuts.has(e.key)){	
		e.stop();
		//console.log(e.key, MooInline.activeBar)
		btn = MooInline.activeBar.getElement('.mi'+MooInline.shortcuts[e.key])
		btn.fireEvent('mousedown', btn)
	};
		
*/