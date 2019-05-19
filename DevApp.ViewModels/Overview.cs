﻿using System;
using System.Threading;
using DotNetify.Elements;

namespace DotNetify.DevApp
{
   public class Overview : BaseVM
   {
      public string Content => new Markdown("DotNetify.DevApp.Docs.Overview.md");
   }

   public class OverviewKO : BaseVM
   {
      public string Content => new Markdown("DotNetify.DevApp.Docs.Knockout.Overview.md");
   }

   public class OverviewVue : BaseVM
   {
      public string Content => new Markdown("DotNetify.DevApp.Docs.Vue.Overview.md");
   }

   public class OverviewBlazor : BaseVM
   {
      public string Content => new Markdown("DotNetify.DevApp.Docs.Blazor.Overview.md");
   }

   public class RealTimePush : BaseVM
   {
      private Timer _timer;
      public string Greetings => "Hello World!";
      public DateTime ServerTime => DateTime.Now;

      public RealTimePush()
      {
         _timer = new Timer(state =>
         {
            Changed(nameof(ServerTime));
            PushUpdates();
         }, null, 0, 1000); // every 1000 ms.
      }

      public override void Dispose() => _timer.Dispose();
   }

   public class ServerUpdate : BaseVM
   {
      public class Person
      {
         public string FirstName { get; set; }
         public string LastName { get; set; }
      }

      public string Greetings { get; set; } = "Hello World!";

      public Action<Person> Submit => person =>
      {
         Greetings = $"Hello {person.FirstName} {person.LastName}!";
         Changed(nameof(Greetings));
      };
   }

   public class TwoWayBinding : BaseVM
   {
      public string Greetings => $"Hello {Name}";

      private string _name = "World";

      public string Name
      {
         get => _name;
         set
         {
            _name = value;
            Changed(nameof(Greetings));
         }
      }
   }
}