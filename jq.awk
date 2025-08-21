#!/usr/bin/awk -f

{
  isValidJson = system("echo '"$0"' | jq -e '.' > /dev/null 2>&1");

  if (isValidJson == 0) {
    system("echo '"$0"' | jq 'del(.time, .pid, .hostname)'");
  } else {
    print $0;
  }
}
