package mapReduce;

import java.io.IOException;

import org.apache.hadoop.io.DoubleWritable;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Mapper;

// Mapper for finish job--emits (-1*rank, node number) from intermediate format lines
public class FinishMapper extends Mapper<LongWritable, Text, Text, Text>
{
	public void map(LongWritable key, Text value, Context context)
			throws IOException,InterruptedException {
		
		String line = value.toString();
		String[] kvs = line.split("\t");
		String[] parts = kvs[1].split(";");
		
		//Send original input to know if already friends
		if (parts.length <= 1) {
			System.out.println(kvs[0]+"\tEXISTING;"+kvs[1]);
			context.write( new Text(kvs[0]), new Text("EXISTING;"+kvs[1]) );
		} else {
			System.out.println(kvs[0]+"\t"+kvs[1]);
			context.write( new Text(kvs[0]), new Text(kvs[1]) );	
		}
	}
}