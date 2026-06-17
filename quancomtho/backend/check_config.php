<?php
foreach (glob('config/*.php') as $file) {
    try {
        $data = require $file;
        if (!is_array($data)) {
            echo "File $file returns " . gettype($data) . "\n";
        }
    } catch (\Throwable $e) {
        echo "Error in $file: " . $e->getMessage() . "\n";
    }
}
echo "Check done.\n";
