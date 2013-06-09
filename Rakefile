require 'fileutils'

# Based on the original script by @schacon on showoff
# @see https://github.com/schacon/showoff/blob/master/lib/showoff_utils.rb
namespace :github do
    desc 'Publish the demo site to the github pages (gh-pages) branch'
    task :pages do
        demo_dir = '_demo'
        pack_demo demo_dir
        `git add #{demo_dir}`
        sha = `git write-tree`.chomp
        tree_sha = `git rev-parse #{sha}:#{demo_dir}`.chomp
        `git read-tree HEAD`  # reset staging to last-commit
        ghp_sha = `git rev-parse gh-pages 2>/dev/null`.chomp
        extra = ghp_sha != 'gh-pages' ? "-p #{ghp_sha}" : ''
        commit_sha = `echo 'Updated demo' | git commit-tree #{tree_sha} #{extra}`.chomp
        `git update-ref refs/heads/gh-pages #{commit_sha}`

        puts <<-TXT
gh-pages branch has been updated successfully. You may now run this commando to publish it to GitHub:

    `git push origin gh-pages`

        TXT
        remove_demo demo_dir
    end
end

def pack_demo(dir)
    remove_demo dir
    FileUtils.mkdir dir
    FileUtils.cp_r %w(css js index.html), dir
end

def remove_demo(dir)
    FileUtils.rm_rf dir
end

task default: :'github:pages'