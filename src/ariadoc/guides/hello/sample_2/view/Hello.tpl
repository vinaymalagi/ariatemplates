{Template {
    $classpath:'ariadoc.guides.hello.sample_2.view.Hello',
	  $css: [
      {importType: 'Default', modulePath: './HelloStyle.tpl.css.js', name: 'helloSample2ViewStyle', classpath: 'ariadoc.guides.hello.sample_2.view.HelloStyle'}
    ],
    $script: {importType: 'Default', modulePath: './HelloScript.js', name: 'helloSample2Script', classpath: 'ariadoc.guides.hello.sample_2.view.HelloScript'}
}}
  {macro main()}
    <div class="travelerForm">
        <div class="formHelpMsg">Hello {foreach people inArray data.people} ${people.name} {/foreach}, this is Aria Templates!
		<br/><br/>Click on a person to view its personal details:</div>

        {repeater {
            loopType: "array",
            content: data.people,
            type: "DIV",
            childSections : {
              id: "psection",
              macro: "personDisplay",
              bindRefreshTo:{fn:"getRepeaterSectionBinding"},
              type: "DIV"
            }
        }/}
    </div>
  {/macro}

  {macro personDisplay(repeaterItem)}
    {var person=repeaterItem.item/}
    {var detailsVisible=(person["data:detailsVisible"]==true)/}
    {var cls=(detailsVisible)? "pwdetails" : "pnodetail"/}

    <div class="${cls}" {on click {fn:"toggleDetailDisplay",args:person}/}>
        ${person.name}
        {if detailsVisible}: ${person.age} years old {/if}
    </div>
  {/macro}

{/Template}
