package mapReduce;

import java.io.IOException;

import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Mapper;

public class InitMapper extends Mapper<LongWritable, Text, Text, Text>
{
	public void map (LongWritable key, Text value, Context context) 
		throws IOException,InterruptedException {
		
		String line = value.toString();
		String[] entities = line.split("\t");
	
		String entity1 = entities[0];
		String entity2 = entities[1];
				
		context.write(new Text(entity1), new Text(entity2));	
	}
}