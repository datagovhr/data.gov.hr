<?php

/*
  Extracts translatable strings from t(), t(,array()), format_plural()
  and other function calls, plus adds some file specific strings. Only
  literal strings with no embedded variables can be extracted. Generates
  POT files, errors are printed on STDERR.

  Originally by Jacobo Tarrio <jtarrio [at] alfa21.com> (2003, 2004 Alfa21 Outsourcing)
  Maintained by Gabor Hojtsy <goba [at] php.net>
  Licensed under the terms of the GNU General Public License
*/

  @ini_set('memory_limit', '16M');

  if (isset($_SERVER['SERVER_ADDR'])) {
    define('OVERHTTP', TRUE);
    header('Content-type: text/plain; charset=utf-8');
    print_status("Starting.\n\n");
  }
  else {
    define('OVERHTTP', FALSE);
  }

  set_time_limit(0);
  if (!defined("STDERR") && !OVERHTTP) {
    define('STDERR', fopen('php://stderr', 'w'));
  }
  
  if (!OVERHTTP) {
    $argv = $GLOBALS['argv'];
    array_shift ($argv);
    if (count($argv)) {
      switch ($argv[0]) {
        case '--help' :
          print "Drupal translation template generator\n";
          print "Usage: extractor.php [OPTIONS]\n\n";
          print "Possible options:\n";
          print " --auto   Autodiscovers files in current folder (default)\n";
          print " --files  Specify a list of files to generate templates for\n";
          print " --debug  Only perform a 'self test'\n";
          print " --help   Display this message\n\n";
          print "You can also drop this file to a folder, and access it from\n";
          print "your browser. It will generate template files for all Drupal\n";
          print "files in all subfolders recursively.\n";
          return 1;
          break;
        case '--files' :
          array_shift($argv);
          $files = $argv;
          break;
        case '--debug' :
          $files = array(__FILE__);
          break;
        case '--auto' :
          $files = explore_dir();
          break;
      }
    }
    else {
      $files = explore_dir();
    }
  }
  else {
    $files = explore_dir();
  }

  $strings = $file_versions = $installer_strings = array();

  foreach ($files as $file) {
    print_status("Processing $file...\n");
    $code = file_get_contents($file);

    find_version_number($code, $file, $file_versions);

    // .info files are not PHP code
    if (strpos($file, '.info') !== FALSE) {
      find_info_file_strings($file, $strings);
      continue;
    }
    
    // Extract raw tokens
    $raw_tokens = token_get_all($code);

    // Remove whitespace and HTML
    $tokens = array();
    $lineno = 1;
    foreach ($raw_tokens as $tok) {
      if ((!is_array($tok)) || (($tok[0] != T_WHITESPACE) && ($tok[0] != T_INLINE_HTML))) {
        if (is_array($tok)) {
          $tok[] = $lineno;
        }
        $tokens[] = $tok;
      }
      if (is_array($tok)) {
        $lineno += count(split("\n", $tok[1])) - 1;
      } else {
        $lineno += count(split("\n", $tok)) - 1;
      }
    }
    unset($raw_tokens);
    
    find_t_calls($tokens, $file, $strings);
    find_t_calls($tokens, $file, $strings, '_locale_import_message');
    find_dollart_calls($tokens, $file, $strings);

    // find installer related strings
    find_t_calls($tokens, $file, $installer_strings, 'st');
    find_t_calls($tokens, $file, $installer_strings, '_locale_import_message', TRUE);
    find_dollart_calls($tokens, $file, $installer_strings, TRUE);

    find_watchdog_calls($tokens, $file, $strings);
    find_format_plural_calls($tokens, $file, $strings);
    
    find_perm_hook($code, $file, $strings);
    find_node_types_hook($code, $file, $strings);
    find_module_name($code, $file, $strings);
    find_language_names($code, $file, $strings);
    
    add_date_strings($file, $strings);
    add_format_interval_strings($file, $strings);
  }

  build_files($strings, $file_versions);
  build_files($installer_strings, $file_versions, 'installer');
  write_files();

  print_status("\nDone.\n");

  function build_files(&$strings, &$file_versions, $forcename = NULL) {
    foreach ($strings as $str => $fileinfo) {
      $occured = $filelist = array();
      foreach ($fileinfo as $file => $lines) {
        $occured[] = "$file:" . join(";", $lines);
        if (isset($file_versions[$file])) {
          $filelist[] = $file_versions[$file];
        }
      }
    
      // Mark duplicate strings (both translated in the app and in the installer)
      $occurances = join(" ", $occured);
      if (strpos($occurances, '(dup)') !== FALSE) {
        $occurances = '(duplicate) ' . str_replace('(dup)', '', $occurances);
      }
      $output = "#: $occurances\n";

      // Name forcing, .info file folding and multiple occurances collection
      if (isset($forcename)) {
        $filename = $forcename;
      }
      elseif (count($occured) == 2 && strpos($occurances, '.module') && strpos($occurances, '.info')) {
        $filename = str_replace('.info', '.module', $file);
      }
      else {
        $filename = (count($occured) > 1 ? 'general' : $file);
      }

      if (strpos($str, "\0") === FALSE) {
        $output .= "msgid \"$str\"\n";
        $output .= "msgstr \"\"\n";
      }
      else {
        list ($singular, $plural) = explode("\0", $str);
        $output .= "msgid \"$singular\"\n";
        $output .= "msgid_plural \"$plural\"\n";
        $output .= "msgstr[0] \"\"\n";
        $output .= "msgstr[1] \"\"\n";
      }
      $output .= "\n";

      store($filename, $output, $filelist);
    }
  }

  function write_files() {
    $output = store(0, 0, array(), 1);

    // Merge small files into general.pot
    foreach ($output as $file => $content) {
      if (count($content) <= 11 && $file != 'general') {
        @$output['general'][1] = array_unique(array_merge($output['general'][1], $content[1]));
        if (!isset($output['general'][0])) {
          $output['general'][0] = $content[0];
        }
        unset($content[0]);
        unset($content[1]);
        foreach ($content as $msgid) {
          $output['general'][] = $msgid;
        }
        unset($output[$file]);
      }
    }

    // Generate file lists and output files
    foreach ($output as $file => $content) {
      $tmp = preg_replace('<[/]?([a-zA-Z]*/)*>', '', $file);
      $file = str_replace('.', '-', $tmp) .'.pot';
      $filelist = $content[1]; unset($content[1]);
      if (count($filelist) > 1) {
        $filelist = "Generated from files:\n#  " . join("\n#  ", $filelist);
      }
      elseif (count($filelist) == 1) {
        $filelist = "Generated from file: " . join("", $filelist);
      }
      else {
        $filelist = "No version information was available in the source files.";
      }
      $fp = fopen($file, 'w');
      fwrite($fp, str_replace("--VERSIONS--", $filelist, join("", $content)));
      fclose($fp);
    }
  }

  function store($file = 0, $input = 0, $filelist = array(), $get = 0) {
    static $storage = array();
    if (!$get) {

      // Keep info file strings with their module strings
      $file = str_replace('.info', '.module', $file);

      if (isset($storage[$file])) {
       $storage[$file][1] = array_unique(array_merge($storage[$file][1], $filelist));
       $storage[$file][] = $input;
      }
      else {
        $storage[$file] = array();
        // You can override the header (with a language team specific variant for example),
        // if you generate missing templates for yourself, and would like to work quickly.
        $storage[$file][0] = (function_exists('write_header_custom') ? write_header_custom($file) : write_header($file));
        $storage[$file][1] = $filelist;
        $storage[$file][2] = $input;
      }
    }
    else {
      return $storage;
    }
  }

  function write_header($file) {
    $output  = "# LANGUAGE translation of Drupal (". $file .")\n";
    $output .= "# Copyright YEAR NAME <EMAIL@ADDRESS>\n";
    $output .= "# --VERSIONS--\n";
    $output .= "#\n";
    $output .= "#, fuzzy\n";
    $output .= "msgid \"\"\n";
    $output .= "msgstr \"\"\n";
    $output .= "\"Project-Id-Version: PROJECT VERSION\\n\"\n";
    $output .= "\"POT-Creation-Date: " . date("Y-m-d H:iO") . "\\n\"\n";
    $output .= "\"PO-Revision-Date: YYYY-mm-DD HH:MM+ZZZZ\\n\"\n";
    $output .= "\"Last-Translator: NAME <EMAIL@ADDRESS>\\n\"\n";
    $output .= "\"Language-Team: LANGUAGE <EMAIL@ADDRESS>\\n\"\n";
    $output .= "\"MIME-Version: 1.0\\n\"\n";
    $output .= "\"Content-Type: text/plain; charset=utf-8\\n\"\n";
    $output .= "\"Content-Transfer-Encoding: 8bit\\n\"\n";
    $output .= "\"Plural-Forms: nplurals=INTEGER; plural=EXPRESSION;\\n\"\n\n";

    return $output;
  }

  function format_quoted_string($str) {
    $quo = substr($str, 0, 1);
    $str = substr($str, 1, -1);
    if ($quo == '"') {
      $str = stripcslashes($str);
    } else {
      $str = strtr($str, array("\\'" => "'", "\\\\" => "\\"));
    }
    return addcslashes($str, "\0..\37\\\"");
  }
  
  function marker_error($file, $line, $marker, &$tokens, $ti) {
    print_status("Invalid marker content in $file:$line\n* $marker(", TRUE);
    $ti += 2;
    $tc = count($tokens);
    $par = 1;
    while ((($tc - $ti) > 0) && $par) {
      if (is_array($tokens[$ti])) {
        print_status($tokens[$ti][1], TRUE);
      } else {
        print_status($tokens[$ti], TRUE);
        if ($tokens[$ti] == "(") {
          $par++;
        }
        if ($tokens[$ti] == ")") {
          $par--;
        }
      }
      $ti++;
    }
    print_status("\n\n", TRUE);
  }
  
  /*
    Detect all occurances of one of these sequences:
      T_STRING("t") + "(" + T_CONSTANT_ENCAPSED_STRING + ")"
      T_STRING("t") + "(" + T_CONSTANT_ENCAPSED_STRING + ","
  */
  function find_t_calls(&$tokens, $file, &$strings, $functionname = 't', $markdup = FALSE) {

    $ti = 0;
    $tc = count($tokens);

    while (($tc - $ti) > 3) {
      
      list($ctok, $par, $mid, $rig) = array($tokens[$ti], $tokens[$ti+1], $tokens[$ti+2], $tokens[$ti+3]);
      if (!is_array($ctok)) {
        $ti++;
        continue;
      }
      list($type, $string, $line) = $ctok;
      
      if (($type == T_STRING) && ($string == $functionname) && ($par == "(")) {
        
        if (in_array($rig, array(")", ","))
            && (is_array($mid) && ($mid[0] == T_CONSTANT_ENCAPSED_STRING))) {

          $strings[format_quoted_string($mid[1])][$file][] = $line . ($markdup ? '(dup)' : '');
        }
        
        // $functionname() found, but inside is something which is not a string literal
        else {
          marker_error($file, $line, $functionname, $tokens, $ti);
        }
      }
      $ti++;
    }
  }
  
  /*
    Detect all occurances of one of these sequences:
      T_VARIABLE("$t") + "(" + T_CONSTANT_ENCAPSED_STRING + ")"
      T_VARIABLE("$t") + "(" + T_CONSTANT_ENCAPSED_STRING + ","
  */
  function find_dollart_calls(&$tokens, $file, &$strings, $markdup = FALSE) {

    $ti = 0;
    $tc = count($tokens);

    while (($tc - $ti) > 3) {
      
      list($ctok, $par, $mid, $rig) = array($tokens[$ti], $tokens[$ti+1], $tokens[$ti+2], $tokens[$ti+3]);
      if (!is_array($ctok)) {
        $ti++;
        continue;
      }
      list($type, $string, $line) = $ctok;
      
      if (($type == T_VARIABLE) && ($string == '$t') && ($par == "(")) {
        
        if (in_array($rig, array(")", ","))
            && (is_array($mid) && ($mid[0] == T_CONSTANT_ENCAPSED_STRING))) {

          $strings[format_quoted_string($mid[1])][$file][] = $line . ($markdup ? '(dup)' : '');
        }
        
        // $t() found, but inside is something which is not a string literal
        else {
          marker_error($file, $line, $functionname, $tokens, $ti);
        }
      }
      $ti++;
    }
  }

  /*
    Detect all occurances this sequence:
      T_STRING("format_plural") + "(" + ..anything (might be more tokens).. +
      "," + T_CONSTANT_ENCAPSED_STRING +
      "," + T_CONSTANT_ENCAPSED_STRING + ")"
  */
  function find_format_plural_calls(&$tokens, $file, &$strings) {
    
    $ti = 0;
    $tc = count($tokens);

    while (($tc - $ti) > 7) {
      
      list($ctok, $par1) = array($tokens[$ti], $tokens[$ti+1]);
      if (!is_array($ctok)) {
        $ti++;
        continue;
      }
      list($type, $string, $line) = $ctok;
      
      if (($type == T_STRING) && ($string == "format_plural") && ($par1 == "(")) {
        
        // Eat up everything that is used as the first parameter
        $tn = $ti+2;
        $depth = 0;
        while (!($tokens[$tn] == "," && $depth == 0)) {
          if ($tokens[$tn] == "(") {
            $depth++;
          }
          elseif ($tokens[$tn] == ")") {
            $depth--;
          }
          $tn++;
        }
        
        // Get further parameters
        list($comma1, $singular, $comma2, $plural, $par2) = array($tokens[$tn], $tokens[$tn+1], $tokens[$tn+2], $tokens[$tn+3], $tokens[$tn+4]);
        
        if (($comma2 == ",") && ($par2 == ")") &&
            (is_array($singular) && ($singular[0] == T_CONSTANT_ENCAPSED_STRING)) &&
            (is_array($plural) && ($plural[0] == T_CONSTANT_ENCAPSED_STRING))) {

          $strings[format_quoted_string($singular[1]) .
          "\0" .
          format_quoted_string($plural[1])][$file][] = $line;
        }
        
        // format_plural() found, but the parameters are not correct
        else {
          marker_error($file, $line, "format_plural", $tokens, $ti);
        }
      }
      $ti++;
    }
  }
  
  /*
    Detect all occurances of this sequence:
      T_STRING("watchdog") + "(" + T_CONSTANT_ENCAPSED_STRING + ","
  */
  function find_watchdog_calls(&$tokens, $file, &$strings) {
    
    $ti = 0;
    $tc = count($tokens);

    while (($tc - $ti) > 3) {
      
      list($ctok, $par, $mid, $rig) = array($tokens[$ti], $tokens[$ti+1], $tokens[$ti+2], $tokens[$ti+3]);
      if (!is_array($ctok)) {
        $ti++;
        continue;
      }
      list($type, $string, $line) = $ctok;
      
      if (($type == T_STRING) && ($string == "watchdog") && ($par == "(")) {
        
        if (($rig == ",")
            && (is_array($mid) && ($mid[0] == T_CONSTANT_ENCAPSED_STRING))) {

          $strings[format_quoted_string($mid[1])][$file][] = $line;
        }
        
        // watchdog() found, but inside is something which is not a string literal
        else {
          marker_error($file, $line, "watchdog", $tokens, $ti);
        }
      }
      $ti++;
    }
  }
  
  // This will get confused if a similar pattern is found in a comment...
  function find_perm_hook($code, $file, &$strings) {
    
    if (preg_match('!^(.+function \\w+_perm\\(\\) \\{\s+return)([^\\}]+)\\}!Us', $code, $hook_code)) {
      $lines = substr_count($hook_code[1], "\n") + 1;
      preg_match_all('!(["\'])([a-zA-Z -]+)\1!', $hook_code[2], $items, PREG_PATTERN_ORDER);
      foreach ($items[2] as $item) {
        $strings[$item][$file][] = $lines;
      }
    }
  }
  
  // This will also get confused if a similar pattern is found in a comment...
  function find_node_types_hook($code, $file, &$strings) {
    
    if (preg_match('!^(.+function \\w+_node_types\\(\\) \\{\s+return)([^\\}]+)\\}!Us', $code, $hook_code)) {
      $lines = substr_count($hook_code[1], "\n") + 1;
      preg_match_all('!(["\'])([0-9a-z-]+)\1!', $hook_code[2], $items, PREG_PATTERN_ORDER);
      foreach ($items[2] as $item) {
        $strings[$item][$file][] = $lines;
      }
    }
  }
  
  // This will get confused if a similar pattern is found in a comment...
  function find_module_name($code, $file, &$strings) {

    if (preg_match('!function (\\w+)_help\\(!', $code, $module_name) &&
        !in_array($module_name[1], array('menu_get_active', 'xmlrpc_server_method'))) {
      $strings[$module_name[1]][$file][] = 0;
    }
  }
  
  function find_language_names($code, $file, &$strings) {
    
    if (preg_match("!locale\\.inc$!", $file) &&
        preg_match("!^(.+function _locale_get_iso639_list\\(\\) {)([^\\}]+)\\}!Us", $code, $langcodes)) {
      $lines = substr_count($langcodes[1], "\n") + 1;
      preg_match_all('!array\\((["\'])([^\'"]+)\1!', $langcodes[2], $items, PREG_PATTERN_ORDER);
      foreach ($items[2] as $item) {
        $strings[$item][$file][] = $lines;
      }
    }
  }
  
  // Get the exact version number from the file, so we can push that into the pot
  function find_version_number($code, $file, &$file_versions) {

    // Prevent CVS from replacing this pattern with actual info
    if (preg_match('!\\$I' . 'd: ([^\\$]+) Exp \\$!', $code, $version_info)) {
      $file_versions[$file] = $version_info[1];
    }
  }
  
  // Add date strings if locale.module is parsed
  function add_date_strings($file, &$strings) {
  
    if (preg_match('!(^|/)locale.module$!', $file)) {
      for ($i = 1; $i <= 12; $i++) {
        $stamp = mktime(0, 0, 0, $i, 1, 1971);
        $strings[date("F", $stamp)][$file][] = 0;
        $strings[date("M", $stamp)][$file][] = 0;
      }

      for ($i = 0; $i <= 7; $i++) {
        $stamp = $i * 86400;
        $strings[date("D", $stamp)][$file][] = 0;
        $strings[date("l", $stamp)][$file][] = 0;
      }
    }
  }
  
  // Add format_interval special strings if common.inc is parsed
  function add_format_interval_strings($file, &$strings) {
  
    if (preg_match('!(^|/)common.inc$!', $file)) {
      $components = array(
        '1 year' => '%count years',
        '1 week' => '%count weeks',
        '1 day'  => '%count days',
        '1 hour' => '%count hours',
        '1 min'  => '%count min',
        '1 sec'  => '%count sec');
      
      foreach($components as $singular => $plural) {
        $strings[$singular."\0".$plural][$file][] = 0;
      }
    }
  }

  // Parse an .info file and add strings to the list
  function find_info_file_strings($file, &$strings) {

    $info = array();

    if (file_exists($file)) {
      $info = parse_ini_file($file);
    }
    // We need everything but dependencies,
    // see _module_parse_info_file() on what is
    // a possible .info file setting
    unset($info['dependencies']);

    foreach ($info as $item) {
      $strings[$item][$file][] = 0;
    }
  }

  // Grab all filename relevant for extraction
  function explore_dir($path = '') {
    $files = glob("$path*.{php,inc,module,engine,theme,install,info}", GLOB_BRACE);
    $dirs = glob("$path*", GLOB_ONLYDIR);
    foreach ($dirs as $dir) {
      if (!preg_match("!(^|.+/)(CVS|.svn)$!", $dir)) {
        $files = array_merge($files, explore_dir("$dir/"));
      }
    }
    if (($id = array_search('extractor.php', $files)) !== FALSE) {
      unset($files[$id]);
    }
    return $files;
  }

  function print_status($text, $error = FALSE) {
    if (OVERHTTP) {
      print $text;
    }
    elseif ($error) {
      fwrite(STDERR, $text);
    }
  }
  
  return;

  // These are never executed, you can run extractor.php on itself to test it
  $a = t("Test string 1" );
  $b = t("Test string 2 %string", array("%string" => "how do you do"));
  $c = t('Test string 3');
  $d = t("Special\ncharacters");
  $e = t('Special\ncharacters');
  $g = t('Embedded $variable');
  $h = t("more \$special characters");
  $i = t('even more \$special characters');
  $j = t("Mixed 'quote' \"marks\"");
  $k = t('Mixed "quote" \'marks\'');
  $l = t('This is some repeating text');
  $m = t("This is some repeating text");
  $o = format_plural($days, "one day", "%count days");
  $p = format_plural(embedded_function_call($count), "one day", "%count days");
  
  function embedded_function_call() { return 12; }
  
  function extractor_perm() {
    return array("access extrator data", 'administer extractor data');
  }
  
  function extractor_help($section = 'default') {
    watchdog('help', t('Help called'));
    return t('This is some help');
  }
  
  function extractor_node_types() {
    return array("extractor-cooltype", "extractor-evencooler");
  }
