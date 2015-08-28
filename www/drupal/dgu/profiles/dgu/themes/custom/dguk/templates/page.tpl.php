<?php
  global $user;
  if (in_array('data publisher', array_values($user->roles))) {
    $user = user_load($user->uid);
  }
?>

<script type="text/javascript">
function changeAppTitle(){
	$(".apps-header").text("Aplikacije");
	$("#contact-site-form").prepend("<h1>Kontakt</h1>");
}
window.onload  = changeAppTitle;
</script>

<style type="text/css">
	a.helper {
color:#fff;
}

ul {
	list-style: none;
	margin: 0;
	padding: 0;
}
</style>

<header>
   <div id="mitzbar" class="without-publisher" style="background-color:gray !important;color:white !important;height:40px;line-height:40px;">
    <div class="container mitzDown">
		Ove internetske stranice su u ranoj (beta) fazi. <a class="helper" href="/contact">Javite nam svoje prijedloge i komentare, hvala!</a>
    </div>
  </div>

<div class="head_nav">
	<div class="container">					
		<a href="https://gov.hr/" class="logoSmall" title="Središnji državni portal" target="_blank"> </a>                                     
		 <ul class="languages">                     	
			<li><a href="https://pretinac.gov.hr" target="_blank" title="Korisnički pretinac" class="non-ext">e-Građani</a></li>                  	                
		</ul>            
	</div>
	<div class="clear"></div>
</div>


<div id="mitzbar" class="<?php print ($user->uid == 1 || in_array('data publisher', array_values($user->roles))) ? 'with' : 'without' ?>-publisher">
    <div class="container">
        <a class="brand" href="/" rel="home">
          <!--
            <div id="dgu-header" class="retina-img">
                <img src="/assets/img/dgu-header-cropped.png" alt="DATA.GOV.HR" />
            </div>
            -->
        </a>

        <?php
          // $main_menu is set to menu-interact and $secondary_menu is set to menu-apps
          // otherwise context doesn't work
          $data_menu = dguk_get_data_menu();
          $apps_menu = dguk_get_apps_menu($secondary_menu);
          $interact_menu = dguk_get_interact_menu($main_menu);

          $active = 1;
          if (strpos($data_menu, 'subnav-data active')) {
            $active = 2;
          }
          if (strpos($apps_menu, 'subnav-apps active')) {
            $active = 3;
          }
          if (strpos($interact_menu, 'subnav-interact active')) {
            $active = 4;
          }
          if (arg(0) == 'user' || (arg(0) == 'admin' && arg(1) == 'workbench')) {
            $active = 6;
          }
        ?>

      <div class="chevron position<?php print $active;?>"></div>
        <nav id="dgu-nav" class="mitzNav">
          <?php //print dguk_get_main_menu($main_menu);?>
          
          <div class="nav-search" style="max-width: 42%;margin-left: 45%;">
            <form class="input-group input-group-sm" action="/data/search">
              <input type="text" class="form-control search mitzSearch" name="q" placeholder="Pretražite podatke...">
              <span class="input-group-btn">
                <button type="submit" class="btn btn-primary"><i class="icon-search"></i></button>
              </span>
            </form>
          </div>

		<?php if ($user->uid == 0):?>	
			<a id="userLogin" href="/saml_login?ReturnTo=hr/user" class="nav-user btn-default btn btn-primary js-tooltip" title="Prijavite se"><i class="icon-user"></i>&nbsp;Prijava</a>				
		<?php else: ?>
			<a href="/user" id="userLogin" class="nav-user btn-default btn btn-primary js-tooltip" title="Pregledajte svoj profil"><i class="icon-user"></i>&nbsp;Profil</a>				  
		<?php endif; ?>	  
          

          <?php if ($user->uid == 1 || in_array('data publisher', array_values($user->roles))): ?>
            <span class="dropdown">
              <a class="nav-publisher btn btn-info dropdown-button  js-tooltip" data-toggle="dropdown" title="Odaberite akciju" href="#"><i class="icon-lock"></i></a>
              <ul class="dropdown-menu dgu-user-dropdown" role="menu" aria-labelledby="dLabel">
                <li role="presentation" class="dropdown-header">Alati</li>
                <li><a href="/dataset/new">Dodaj skup podataka</a></li>
                <li><a href="/harvest">Dohvati sve skupove podataka</a></li>
                <li role="presentation" class="dropdown-header">Moji izdava&ccaron;i</li>
                <?php if (!empty($user->field_publishers)) foreach ($user->field_publishers[LANGUAGE_NONE] as $publisher_ref): ?>

                  <?php $publisher = entity_load_single('ckan_publisher', $publisher_ref['target_id']); ?>

                  <li><a href="/publisher/<?php print $publisher->name?>"><?php print $publisher->title?></a></li>
                <?php endforeach; ?>
              </ul>
            </span>
          <?php endif; ?>


        </nav>
    </div>
</div>

<div id="blackbar" class="<?php print ($user->uid == 1 || in_array('data publisher', array_values($user->roles))) ? 'with' : 'without' ?>-publisher">
    <div class="container">
        
 <a class="brand" href="/" rel="home">
          <!--
            <div id="dgu-header" class="retina-img">
                <img src="/assets/img/dgu-header-cropped.png" alt="DATA.GOV.HR" />
            </div>
            -->
        </a>
        <?php
          // $main_menu is set to menu-interact and $secondary_menu is set to menu-apps
          // otherwise context doesn't work
          $data_menu = dguk_get_data_menu();
          $apps_menu = dguk_get_apps_menu($secondary_menu);
          $interact_menu = dguk_get_interact_menu($main_menu);

          $active = 1;
          if (strpos($data_menu, 'subnav-data active')) {
            $active = 2;
          }
          if (strpos($apps_menu, 'subnav-apps active')) {
            $active = 3;
          }
          if (strpos($interact_menu, 'subnav-interact active')) {
            $active = 4;
          }
          if (arg(0) == 'user' || (arg(0) == 'admin' && arg(1) == 'workbench')) {
            $active = 6;
          }
        ?>

      <div class="chevron position<?php print $active;?>"></div>
        <nav id="dgu-nav">
          <?php //print dguk_get_main_menu($main_menu);?>
          <div class="text-links">
            <a href="/data" class="trigger-subnav nav-data <?php if($active == 2) print 'active'; ?>">Podaci</a>
            <a href="/apps" class="trigger-subnav nav-apps <?php if($active == 3) print 'active'; ?>">Aplikacije</a>
            <a href="/interact" class="trigger-subnav nav-interact <?php if($active == 4) print 'active'; ?>">Dodatni sadržaji</a>
	    <a href="/kontakti" class="nav-interact">Kontakti</a>
          </div>
         
			
          <?php $destination = drupal_get_destination(); ?>
          

          <?php if ($user->uid == 1 || in_array('data publisher', array_values($user->roles))): ?>
            <span class="dropdown">         
              <ul class="dropdown-menu dgu-user-dropdown" role="menu" aria-labelledby="dLabel">
                <li role="presentation" class="dropdown-header">Alati</li>
                <li><a href="/dataset/new">Dodaj skup podataka</a></li>
                <li><a href="/harvest">Dohvati sve skupove podataka</a></li>
                <li role="presentation" class="dropdown-header">Moji izdavači</li>
                <?php if (!empty($user->field_publishers)) foreach ($user->field_publishers[LANGUAGE_NONE] as $publisher_ref): ?>

                  <?php $publisher = entity_load_single('ckan_publisher', $publisher_ref['target_id']); ?>

                  <li><a href="/publisher/<?php print $publisher->name?>"><?php print $publisher->title?></a></li>
                <?php endforeach; ?>
              </ul>
            </span>
          <?php endif; ?>


        </nav>
    </div>
</div>
<div id="greenbar" class="">
    <div class="container">
      <?php print $data_menu; ?>
      <?php //print $apps_menu; // Comment out because it can be used in the future. Disable for now because it contains only one item. ?>
      <?php print $interact_menu; ?>
    </div>
</div>
</header>
<div id="pre-content">
  <div class="container">
    <div class="row">
      <div class="col-md-12">
        <?php  print $breadcrumb; ?>
      </div>
    </div>
    <?php if($messages): ?>
      <div class="drupal-messages">
        <div id="messages" ><?php print $messages; ?></div>
      </div>
    <?php endif; ?>
    <?php if($page['highlighted']): ?>
      <?php print render($page['highlighted']); ?>
    <?php endif; ?>
    <?php print render($page['help']); ?>

  </div>
</div>
<div role="main" id="main-content">
  <div class="container">
    <?php if ($action_links): ?>
        <ul class="action-links"><?php print render($action_links); ?></ul>
    <?php endif; ?>

    <?php if (isset($tabs['#primary'][0]) || isset($tabs['#secondary'][0])): ?>
        <nav class="tabs"><?php print render($tabs); ?></nav>
    <?php endif; ?>
    <div class="row">
      <div class="col-md-12">
        <?php print render($page['content_pre']); ?>

        <?php print render($page['content']); ?>

        <?php print render($page['content_post']); ?>
      </div>
    </div>
  </div>
</div><!--/main-->

        <?php if ($page['sidebar_first']): ?>
            <div class="sidebar-first" id="sidebar1">
                <?php print render($page['sidebar_first']); ?>
            </div>
        <?php endif; ?>

        <?php if ($page['sidebar_second']): ?>
            <div class="sidebar-second" id="sidebar2">
                <?php print render($page['sidebar_second']); ?>
            </div>
        <?php endif; ?>
        <div class="clearfix"></div>
    </div><!--/page-->



</div><!--content-container-->
<!--link footer-->
<div class="footer_datagov">
<div class="container">
  <div class="panels-flexible-row panels-flexible-row-12-21 panels-flexible-row-last clearfix row">
  <div class="inside panels-flexible-row-inside panels-flexible-row-12-21-inside panels-flexible-row-inside-last clearfix">
<div class="panels-flexible-region panels-flexible-region-12-leftfooter panels-flexible-region-first col-sm-4">
  <div class="inside panels-flexible-region-inside panels-flexible-region-12-leftfooter-inside panels-flexible-region-inside-first">
<div class="panel-pane pane-custom pane-3 boxed">
  
         <h2 class="pane-title">Portal otvorenih podataka</h2>
    
  
  <div class="pane-content">
    <p>
	<a href="/o-portalu-cijeli" target="_blank">O portalu otvorenih podataka</a><br />
	<a href="/faq" target="_blank">Često postavljana pitanja</a><br />
	<a href="uvjeti-koristenja" target="_blank">Uvjeti korištenja</a><br />
	<a href="/contact" target="_blank">Kontakt obrazac</a><br />
	<a href="https://www.gov.hr" target="_blank" class="non-ext">Središnji državni portal</a><br />
	<a href="https://vlada.gov.hr" target="_blank" class="non-ext">Vlada Republike Hrvatske</a>
	</p>
  </div>

  
  </div>
  </div>
</div>
<div class="panels-flexible-region panels-flexible-region-12-centerfooter col-sm-4">
  <div class="inside panels-flexible-region-inside panels-flexible-region-12-centerfooter-inside">
<div class="panel-pane pane-custom pane-1 boxed">
  
        <h2 class="pane-title">Adresar</h2>
    
  
  <div class="pane-content">
    <p>
	<a href="http://www.digured.hr/" target="_blank" class="non-ext">Središnji katalog službenih dokumenata RH</a><br />
	<a href="http://www.digured.hr/Adresari-i-imenici/(active)/tab210" target="_blank" class="non-ext">Adresar tijela javne vlasti</a><br />
	<a href="http://www.digured.hr/Politicke-stranke-i-izbori/(active)/tab229" target="_blank" class="non-ext">Adresar političkih stranaka u RH</a><br />
	<a href="http://www.digured.hr/Adresari-i-imenici/(active)/tab264" target="_blank" class="non-ext">Popis dužnosnika u RH</a><br />
	<a href="/dataset/besplatni-telefoni-javne-uprave" target="_blank">Besplatni telefoni javne uprave</a><br />
	<a href="/dataset/pozivi-za-urnu-pomo" target="_blank">Pozivi za žurnu pomoć</a>
	</p>
  </div>

  
  </div>
  </div>
</div>
<div class="panels-flexible-region panels-flexible-region-12-rigthfooter panels-flexible-region-last col-sm-4">
  <div class="inside panels-flexible-region-inside panels-flexible-region-12-rigthfooter-inside panels-flexible-region-inside-last">
<div class="panel-pane pane-custom pane-4 boxed">
  
        <h2 class="pane-title">Korisne poveznice</h2>
    
  
  <div class="pane-content">
     <p>
	<a href="http://www.pristupinfo.hr" target="_blank" class="non-ext">Povjerenik za informiranje</a><br />
	<a href="http://ec.europa.eu/digital-agenda/en/open-data-0" target="_blank" class="non-ext">Europska komisija i otvoreni podaci</a><br />
	<a href="http://publicdata.eu/" target="_blank" class="non-ext">Europski portal otvorenih podataka</a><br />
	<a href="https://open-data.europa.eu/" target="_blank" class="non-ext">Portal otvorenih podataka Europske unije</a><br />
	<a href="http://opendatasupport.eu" target="_blank" class="non-ext">Projekt Open Data Support</a><br />
	<a href="http://www.w3.org/2013/share-psi/" target="_blank" class="non-ext">Tematska mreža Share-PSI</a>
	</p>
  </div>
  </div>
  </div>
  </div>
</div>
  </div>
</div>
</div>
<!--footer-->

<footer class="footer_gov">
		
						
				<div class="container">
					<a href="javascript:;" onclick="$('html, body').animate({ scrollTop: 0 }, 'slow');" >Povratak na vrh</a>
					<span>Copyright &copy; 2015 Vlada Republike Hrvatske. <a href="/uvjeti-koristenja">Uvjeti kori&#353;tenja</a>.</span>
			<ul>
				<li><a target="_blank" href="https://www.linkedin.com/groups/Open-data-HR-7483080" title="LinkedIn" class="linkedInIcon"><img style="-webkit-user-select: none" src="/assets/img/icon_linkedIn.png" /></a></li>
				<li><a target="_blank" href="https://www.facebook.com/wwwvladahr" title="Facebook"><img style="-webkit-user-select: none" src="/assets/img/icon_facebook.png" /></a></li>
				<li><a target="_blank" href="https://twitter.com/VladaRH" title="Twitter"><img style="-webkit-user-select: none" src="/assets/img/icon_twitter.png" /></a></li>
				<li><a target="_blank" href="https://www.youtube.com/user/wwwvladahr" title="YouTube"><img style="-webkit-user-select: none" src="/assets/img/icon_youtube.png" /></a></li>
				<li><a target="_blank" href="https://www.flickr.com/photos/wwwvladahr" title="Flickr"><img style="-webkit-user-select: none" src="/assets/img/icon_flickr.png" /></a></li>
				<li><a target="_blank" href="https://www.scribd.com/Vlada_RH" title="Scribd"><img style="-webkit-user-select: none" src="/assets/img/icon_scribd.png" /></a></li>
			</ul>
				</div>
				
				 
				
			
			
			<div class="clear"></div>
			
		</footer>
<!-- footer -->