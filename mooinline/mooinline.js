/* Copyright November 2008, Sam Goody ishtov@yahoo.com 
*   Licensed under the Open Source License
*
* 	Credits:
*	Ideas and inspiration: Guillerr from the Mootools IRC, MooEditable
*	Regexes from MooEditable (Both the original and Ryan and Orefalo's excellent contributions).
*	We really want your help!  Please join!!
*
*	Usage: 
*		new MooInline(); - applies to textareas and elements with the class "mooinline"
*		new MooInline('span.editMe', {inline:true}) - will make the spans with the class of editme editable inline.
*		new MooInline({defaults:['Bold', 'HelloWorld, ['JustifyLeft',JustifyRight']]}) - Toolbar will have 3 buttons, one of which is custom defined.  Third button opens a menu with 2 justify options.
*	Extending:
*		MooInline.Buttons.extend({
*			'HelloWorld':{img:'images/smiley.gif', title:'please click', click:function(){alert('hello World!')}},
*		})
*		
*	Any properties in extended object will be passed into the new button.  The following are predefined and have special meaning (All are optional):
*		click: [defaults to the 'document.execute' command] the mousedown event when the button is pressed,
*		args:  [defaults to object key] arguments to be passed to click event, 
*		img:   [If a number, defaults to 'images/i.gif'. Otherwise, no default] background image
*		shortcut: [no default] keyboard shortcut
*		element:[if type is 'text','submit',or 'password', defaults to input.  Otherwise defaults to 'a'] element type
*/

var MooInline = new Class({
	
	Implements: [Events, Options],

	options:{
		xhtml   : true,
		semantic: true,
		auto    : true,
		inline  : false,
		floating: true,					// false not yet available!  Designed to either insert bar into DOM, or float above relevant element.   
		location: 'multiple', 			// 'single', 'pageBottom', none. 'pageTop' doesn't show yet, as it expands upwards off the page.
		defaults: ['Main','File','Link','Justify','Lists','Indents','|','Save']   //toolbar : 'miTextEdit_1',  'miMain_0' if auto is false
	},
	
	initialize: function(els, options){
		this.setOptions(options);
		MooInline.Buttons.self = this;
		this.options.auto ? this.insertMI(els) : this.toolbar(this.options.toolbar);
	},

	insertMI: function(selectors, toolbars){
		
		var els = $$(selectors||'textarea, .mooinline'), i=this.options.inline, l=this.options.location.substr(4,1).toLowerCase(), t=this, mta;
		
		function insertToolbar(){
			var mta = new Element('div', {'class':'miRemove miMooInline '+(i?'miHide':''), 'contentEditable':false }).adopt(
				 new Element('div', {'class':'miWysEditor' }),
				 new Element('textarea', {'class':'miWygEditor miHide', 'type':'text' })
			).inject(document.body);
			t.active = {toolbar:mta.getElement('.miWysEditor')}
			t.toolbar(t.options.defaults, 'miStart', 0);
			return mta;
		}
		function positionToolbar(el, mta){
			var p = el.getCoordinates();
			mta.setStyles({display:'block', width:p.width}); 
			var top = p.top - mta.getCoordinates().height; 
			mta.setStyles({ 'left':p.left, 'top':(top > 0 ? top : p.bottom) });
			el.set('contentEditable', true).focus();
		}
		function insertEl(el){
			var div = new Element('div', {'class':'mtaTextArea '+el.get('class'), 'styles':el.getCoordinates(), text:el.get('value') }).inject(el, 'before');//el.get('styles'), 'styles':.extend() 
			el.addClass('miHide');
			return div;
		}
		
		els.each(function(el, index){
			if(el.get('tag') == 'textarea' || el.get('tag') == 'input') el = insertEl(el);
			if(l=='i' || !mta) mta = insertToolbar(); 
			if(!l || l=='b' || l=='t') el.set('contentEditable', true);
			else if(!i) positionToolbar(el, mta); else el.addEvents({
				'click': function(){ positionToolbar(el, mta);  },
				'blur':function(){ mta.setStyle('display','none'); this.set('contentEditable', false);}
			});
		})
		if(l=='b' || l=='t') mta.addClass('miPosition'+l);
	},
	
	toolbar: function(buttons, row, num){ 	
		var t = this, bar, toolbar = t.active.toolbar;
		var parent = toolbar.getElement('.miR'+num) || new Element('div',{'class':'miR'+num}).inject($(toolbar));
		
		if(!(bar = parent.getElement('.'+row))){ 
			bar = new Element('div', {'class':row}).inject(parent);
			buttons.each(function(btn){
				var x = 0, val = ($type(btn)=='array' ? {'click':btn} : MooInline.Buttons[btn]), clik = ($type(val.click) == 'array'); //clik = true, val = [click:['Bold', 'Italic']]
				//if(!val.img && clik && MooInline.Buttons[val.click[0].img]) val.img = MooInline.Buttons[val.click[0].img];				//Is there a better way to avoid an error?!!	
				if($type(val.img*1) == 'number'){console.log('val.img'); x = val.img; val.img = 'mooinline/images/i.gif' }; 				//if !img - no image.  if 'abc.png', that image.  if num, the num.
								
				var properties = new Hash({
					href:'javascript:void(0)',
					unselectable: 'on',
					title: btn + (clik ? ' Menu' : (val.shortcut ? ' (Ctrl+'+val.shortcut+')':'')), 						//a)Title, if specified. b) else btn, plus - if opens menu, " Menu".  If has shortcut, (Ctrl+shrtct).  [val.arg has been removed as it cannot be called.]
					styles:val.img ? {'background-image':'url('+val.img+')', 'background-position':(16+16*x)+'px 0'}:'', //-16
					events:{
						'mousedown': function(e){ 
							e.stop(); 
							t.active = {toolbar:this.getParent('.miWysEditor')}
							clik ? t.toolbar(val.click,btn,num+1) : (val.click || t.exec)(val.args||btn);
						}
					}
				}).extend(val).erase('args').erase('shortcut').erase('element').erase('click').erase('img').getClean();
				new Element(('submit,text,password'.contains(val.type) ? 'input' : val.element||'a'), properties).inject(bar);
				if (val.click) bar.addEvent('keydown', function(){ if (event.btn == val.shortcut && event.control) val.click });//change to switch
			})
		}
		var n = toolbar.retrieve(num);
		if(n) n.setStyle('display', 'none')
		toolbar.store(num, bar);
		bar.setStyle('display', 'block'); //update to use effects	
	},
	
	exec: function(args){
		args = $splat(args);
		document.execCommand(args[0], args[2]||false, args[1]||null);  //document.execCommand('justifyRight', false, null);
	},	
		
	getRange:function(){
		var sel = window.getSelection ? window.getSelection() : window.document.selection;
		if (!sel) return null;
		this.range = sel.rangeCount > 0 ? sel.getRangeAt(0) : (sel.createRange ? sel.createRange() : null);
		//try { return s.rangeCount > 0 ? s.getRangeAt(0) : (s.createRange ? s.createRange() : null); } catch (e) { /IE bug when used in frameset/ return this.doc.body.createTextRange(); }
	},
	
	setRange: function() {
		if(this.range.select) this.range.select(); //$try(function(){ this.range.select(); });
		else{
			var sel = window.getSelection ? window.getSelection() : window.document.selection;
			if (sel.addRange) {
				sel.removeAllRanges();
				sel.addRange(this.range);
			}
		}
 
		var url = $('miLink').get('value') || "";
		this.exec(['createlink',url]);
		//var url = window.prompt("Enter an URL:", "."); document.execCommand('createlink', false, url);
	},
	
	clean: function(html){
		if($('modalOverlay')){ 
			debug('modal going'); 
			$('windowUnderlay').destroy();
			$('modalOverlay').destroy(); 
		}else debug('no modal');
		
		$$('p>p:only-child').each(function(el){ var p = el.getParent(); if(p.childNodes.length == 1) $el.replaces(p)  });
		//$$('br:last-child').each(function(el){ if(!el.nextSibling && 'h1h2h3h4h5h6lip'.contains(el.getParent().get('tag'))) el.destroy(); });
		//$$('br:last-child').filter(function(el) { return !el.nextSibling; })
	
		var br = '<br'+(this.options.xhtml?'/':'')+'>';
		var xhtml = [
			//[/(<(?:img|input|br)[^/>]*)>/g, '$1 />'] 					// if (this.options.xhtml)//make tags xhtml compatable
		];
		var semantic = [
			[/<li>\s*<div>(.+?)<\/div><\/li>/g, '<li>$1</li>'],			//remove divs from <li>
			[/^([\w\s]+.*?)<div>/i, '<p>$1</p><div>'],					//remove stupid apple divs
			[/<div>(.+?)<\/div>/ig, '<p>$1</p>'],
			[/<span style="font-weight: bold;">(.*)<\/span>/gi, '<strong>$1</strong>'],	// Semantic conversion.  Should be separate array that is merged in if semantic is set to true.
			[/<span style="font-style: italic;">(.*)<\/span>/gi, '<em>$1</em>'],
			[/<b\b[^>]*>(.*?)<\/b[^>]*>/gi, '<strong>$1</strong>'],
			[/<i\b[^>]*>(.*?)<\/i[^>]*>/gi, '<em>$1</em>'],
			[/<u\b[^>]*>(.*?)<\/u[^>]*>/gi, '<span style="text-decoration: underline;">$1</span>']
		];
		var cleanup = [
			[/<br class\="webkit-block-placeholder">/gi, "<br />"],		// Webkit cleanup
			[/<span class="Apple-style-span">(.*)<\/span>/gi, '$1'],	// should be corrected, not to get messed over on nested spans - SG!!!
			[/ class="Apple-style-span"/gi, ''],
			[/<span style="">/gi, ''],
			[/<br\s*\/?>/gi, br],										// Fix BRs, make it easier for next BR steps.
			[/><br\/?>/g, '>'],											// Remove (arguably) useless BRs
			[/^<br\/?>/g, ''],											// Remove leading BRs - perhaps combine with removing useless brs.
			[/<br\/?>$/g, ''],											// Remove leading BRs
			[/<br\/?>\s*<\/(h1|h2|h3|h4|h5|h6|li|p)/gi, '</$1'],		// Remove BRs from end of blocks
			[/<p>\s*<br\/?>\s*<\/p>/gi, '<p>\u00a0</p>'],				// Remove padded paragraphs - replace with non breaking space
			[/<p>(&nbsp;|\s)*<\/p>/gi, '<p>\u00a0</p>'],
			[/<p>\W*<\/p>/g, ''],										// Remove ps with other stuff, may mess up some formatting.
		];
		if(this.options.xhtml)cleanup.extend(xhtml);
		if(this.options.semantic)cleanup.extend(semantic);
		cleanup.each(function(reg){ console.log(reg); html = html.replace(reg[0], reg[1]); });
		return source;
	}
})

MooInline.Buttons = new Hash({
	'Main'         :{click:['Bold','Italic','Underline','Strikethrough','Subscript','Superscript']},
	'File'         :{click:['Paste','Copy','Cut','Redo','Undo']},
	'Link'         :{click:['l0','l1','l2','Unlink'], img:'a4'},
	'Justify'      :{click:['JustifyLeft','JustifyCenter','JustifyRight','JustifyFull']},
	'Lists'        :{click:['InsertOrderedList','InsertUnorderedList']},
	'Indents'       :{click:['Indent','Outdent']},
	
	'|'            :{text:'|'},
	'Bold'         :{ img:'0', shortcut:'b' },
	'Italic'       :{ img:'1', shortcut:'i' },
	'Underline'    :{ img:'2', shortcut:'u' },
	'Strikethrough':{ img:'3', shortcut:'s' },
	'Subscript'    :{ img:'5'},
	'Superscript'  :{ img:'6'},
	'Indent'       :{ img:'11'},
	'Outdent'      :{ img:'12'},
	'Paste'        :{ img:'13'},
	'Copy'         :{ img:'14'},
	'Cut'          :{ img:'15'},
	'Redo'         :{ img:'16', shortcut:'y' },
	'Undo'         :{ img:'17', shortcut:'z' },
	'JustifyLeft'  :{ img:'7', title:'Justify Left'  },
	'JustifyCenter':{ img:'8', title:'Justify Center'},
	'JustifyRight' :{ img:'9', title:'Justify Right' },
	'JustifyFull'  :{ img:'10', title:'Justify Full'  },
	'InsertOrderedList'  :{img:'u0', title:'Numbered List'},
	'InsertUnorderedList':{img:'u1', title:'Bulleted List'},
	'Unlink'       :{ img:'a4'},
	'l0'           :{ 'text':'enter the url', element:'span' },
	'l1'           :{ 'type':'text',   events:{ 'mousedown':function(){ MooInline.Buttons.self.getRange(); }}, 'id':'miLink', unselectable: 'off' }, 
	'l2'           :{ 'type':'submit', events:{ 'click':    function(){ MooInline.Buttons.self.setRange(); }}, 'value':'add link' },
	'noLink'       :{ 'text':'please select the text to be made into a link'},
	'Save'         :{ img:'', click:function(){
						var content = MooInline.Buttons.self.clean();
						(savePath || (savePath = new Request({'url':'http://www.google.com'}))).send(new Hash({ 'page': window.location.pathname, 'content': content }).toQueryString() );	
					}},
	'Display HTML' :{ click:function(){
						var d = $('displayBox');
						if(d.hasClass('miHide')){
							//d.removeClass('hide'); 
							$('displayBox').set({'styles':curEl.getCoordinates(), 'class':'', 'text':curEl.innerHTML.trim()});
						} else d.addClass('miHide'); 
					}},
	'colorPicker'  :{ 'element':'img', 'src':'images/colorPicker.jpg', 'class':'colorPicker', click:function(){
						var lx = mouseLocation.x, ly = mouseLocation.y, Sy=sideSlider.y, b = this.get('width')/7, c=[];
						for(var i=0; i<3; i++){
							var n0=b*i-l,n1=l-b*(i+5);
							if((c[i]=n0<0||n1<0?0:n0<b?n0:n1)>b)c[i]=b; //if(x>b)x=b;x=n0<0||n1<0?0:n0<b?n0:n1;  //c'mon!! Prize for lack of legibility!!!
							x+=((256-x)/256)*Sy;
						}
						c[2]=b-c[2];
					}}
})


MooInline.Buttons.extend({
	'Open Siteroller.org Homepage':{'text':'SiteRoller', 'click':function(){ window.open('http://www.siteroller.org') }},
	'body'         :{'id':'miTrigger', 'text':'Edit Page', click:'place'},
	'file'         :{'text':'file'}, 
	'metadata'     :{'text':'metadata'},		
	'Save Changes' :{click:'save', shortcut:'s', 'class':'saveBtn', 'styles':{'width':'75px'} },
	'newBar'       :{click:'toolbar', args:''},
});

function debug(msg){ if(console)console.log(msg); else alert(msg) }